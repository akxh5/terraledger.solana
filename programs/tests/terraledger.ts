import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { SquadsMock } from "../target/types/squads_mock";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("terraledger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const squadsMock = anchor.workspace.SquadsMock as Program<SquadsMock>;

  const owner = provider.wallet;
  // Use payer for direct web3.js calls
  const payer = (provider.wallet as any).payer as Keypair;
  
  const newOwner = anchor.web3.Keypair.generate();
  const verifier = anchor.web3.Keypair.generate();

  // Mock Squads Multisig Setup
  const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
  const multisigAccount = Keypair.generate();
  
  const [multisigSigner] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("squad"),
      multisigAccount.publicKey.toBuffer(),
      new Uint8Array([0, 0, 0, 0]),
      Buffer.from("vault")
    ],
    SQUADS_PROGRAM_ID
  );

  // Unique landId
  const landId = `land_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const metadataHash = "QmTestHash_TerraLedger_Demo";

  const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("land"), Buffer.from(landId)],
    program.programId
  );

  // Helper to create a mock multisig account on localnet
  async function createMockMultisig(
    keypair: Keypair,
    threshold: number,
    memberCount: number,
  ) {
    await squadsMock.methods
      .initializeMultisig(threshold)
      .accounts({
        multisig: keypair.publicKey,
        createKey: owner.publicKey,
        configAuthority: owner.publicKey,
        payer: owner.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([keypair])
      .rpc();
  }

  before(async () => {
    const sig1 = await provider.connection.requestAirdrop(newOwner.publicKey, 1000000000);
    await provider.connection.confirmTransaction(sig1);
    const sig2 = await provider.connection.requestAirdrop(verifier.publicKey, 1000000000);
    await provider.connection.confirmTransaction(sig2);

    // Fund the multisig vault so it can exist and be used as a signer
    const sig3 = await provider.connection.requestAirdrop(multisigSigner, 1000000000);
    await provider.connection.confirmTransaction(sig3);

    await createMockMultisig(multisigAccount, 2, 3);
  });

  it("Registers land with Squads multisig as registrar_authority", async () => {
      const initialStakeholders = [{ owner: owner.publicKey, sharesBps: 10000 }];
      const initialVerifiers = [verifier.publicKey];

      await program.methods
        .registerLand(landId, metadataHash, initialStakeholders, initialVerifiers, 1000)
        .accounts({
          landAccount: landAccountPda,
          multisig: multisigAccount.publicKey,
          multisigSigner: multisigSigner,
          signer: owner.publicKey,
        } as any)
        .rpc();

      const landAccount = await program.account.landAccount.fetch(landAccountPda);
      expect(landAccount.registrarAuthority.toString()).to.equal(multisigAccount.publicKey.toString());
  });

  it("activate_parcel: verifier activates", async () => {
    await program.methods
      .activateParcel()
      .accounts({
        landAccount: landAccountPda,
        verifier: verifier.publicKey,
      } as any)
      .signers([verifier])
      .rpc();
    
    const landAccount = await program.account.landAccount.fetch(landAccountPda);
    expect(Object.keys(landAccount.status)[0]).to.equal("active");
  });

  it("transfer_partial: sender transfers 2500 bps", async () => {
      await program.methods
        .transferPartial(newOwner.publicKey, 2500)
        .accounts({
          landAccount: landAccountPda,
          signer: owner.publicKey,
        } as any)
        .rpc();

      const landAccount = await program.account.landAccount.fetch(landAccountPda);
      expect(landAccount.stakeholders.length).to.equal(2);
  });



  async function executeViaMultisig(
    ix: anchor.web3.TransactionInstruction,
    multisig: PublicKey,
    vault: PublicKey,
  ) {
    await squadsMock.methods
      .vaultExecute(ix.data)
      .accounts({
        multisig: multisig,
        vault: vault,
        targetProgram: program.programId,
      } as any)
      .remainingAccounts(ix.keys)
      .rpc();
  }

  it("lock_parcel: succeeds when called through correct multisig", async () => {
    const ix = await program.methods.lockParcel()
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner,
        } as any)
        .instruction();

    await executeViaMultisig(ix, multisigAccount.publicKey, multisigSigner);

    const account = await program.account.landAccount.fetch(landAccountPda);
    expect(Object.keys(account.status)[0]).to.equal("locked");
  });

  it("lock_parcel: fails when called with wrong multisig PDA", async () => {
    const wrongMultisig = Keypair.generate();
    await createMockMultisig(wrongMultisig, 2, 3);
    
    const unlockIx = await program.methods.unlockParcel()
        .accounts({ landAccount: landAccountPda, multisig: multisigAccount.publicKey, multisigSigner: multisigSigner } as any)
        .instruction();
    await executeViaMultisig(unlockIx, multisigAccount.publicKey, multisigSigner);

    const [wrongMultisigSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), wrongMultisig.publicKey.toBuffer(), new Uint8Array([0, 0, 0, 0]), Buffer.from("vault")],
      SQUADS_PROGRAM_ID
    );

    // Fund the wrong multisig vault
    const sig = await provider.connection.requestAirdrop(wrongMultisigSigner, 1000000000);
    await provider.connection.confirmTransaction(sig);

    const lockIx = await program.methods.lockParcel()
        .accounts({ landAccount: landAccountPda, multisig: wrongMultisig.publicKey, multisigSigner: wrongMultisigSigner } as any)
        .instruction();

    try {
      await executeViaMultisig(lockIx, wrongMultisig.publicKey, wrongMultisigSigner);
      expect.fail("Should have failed");
    } catch (err: any) {
      // Error will be from Terraledger but wrapped in Anchor's CPI error or similar
      // Actually our mock program returns the error from invoke_signed
      expect(err.toString()).to.contain("UnauthorizedMultisig");
    }
  });

  it("resolve_dispute: succeeds through multisig after dispute raised", async () => {
      await program.methods.raiseDispute().accounts({ landAccount: landAccountPda, signer: owner.publicKey } as any).rpc();
      
      const ix = await program.methods.resolveDispute()
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner,
        } as any)
        .instruction();

      await executeViaMultisig(ix, multisigAccount.publicKey, multisigSigner);

      const account = await program.account.landAccount.fetch(landAccountPda);
      expect(Object.keys(account.status)[0]).to.equal("active");
  });

  it("transfer_authority: transfers to new multisig PDA", async () => {
      const newMultisig = Keypair.generate();
      await createMockMultisig(newMultisig, 2, 3);

      const ix = await program.methods.transferAuthority(newMultisig.publicKey)
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner,
        } as any)
        .instruction();

      await executeViaMultisig(ix, multisigAccount.publicKey, multisigSigner);

      const account = await program.account.landAccount.fetch(landAccountPda);
      expect(account.registrarAuthority.equals(newMultisig.publicKey)).to.be.true;
  });

  it("transfer_authority: clears approved_verifiers on success", async () => {
      const account = await program.account.landAccount.fetch(landAccountPda);
      expect(account.approvedVerifiers.length).to.equal(0);
  });

  it("update_verifiers: blocked during Disputed status via multisig", async () => {
      const accountData = await program.account.landAccount.fetch(landAccountPda);
      const currentAuth = accountData.registrarAuthority;
      
      await program.methods.raiseDispute().accounts({ landAccount: landAccountPda, signer: owner.publicKey } as any).rpc();

      const [newMultisigSigner] = PublicKey.findProgramAddressSync(
        [Buffer.from("squad"), currentAuth.toBuffer(), new Uint8Array([0, 0, 0, 0]), Buffer.from("vault")],
        SQUADS_PROGRAM_ID
      );

      const ix = await program.methods.updateVerifiers([verifier.publicKey])
          .accounts({
              landAccount: landAccountPda,
              multisig: currentAuth,
              multisigSigner: newMultisigSigner,
          } as any)
          .instruction();

      try {
        await executeViaMultisig(ix, currentAuth, newMultisigSigner);
        expect.fail("Should have failed");
      } catch (err: any) {
        expect(err.toString()).to.contain("VerifierUpdateBlockedDuringDispute");
      }
  });

  describe("Governance authority bypass (V1 regression)", () => {
    it("rejects a random wallet as multisig_signer on lock_parcel", async () => {
      const attacker = Keypair.generate();
      const accountData = await program.account.landAccount.fetch(landAccountPda);
      const currentAuth = accountData.registrarAuthority;
      try {
        await program.methods.lockParcel()
          .accounts({
            landAccount: landAccountPda,
            multisig: currentAuth,
            multisigSigner: attacker.publicKey,
          } as any)
          .rpc();
        expect.fail("Should have failed");
      } catch (err: any) {
        expect(err.message).to.match(/MultisigApprovalRequired|seeds constraint|ConstraintSeeds/i);
      }
    });

    it("legitimate vault PDA must succeed", async () => {
      // It might be locked or active right now, unlock it first to be safe
      const accountData = await program.account.landAccount.fetch(landAccountPda);
      const currentAuth = accountData.registrarAuthority;
      const [currentMultisigSigner] = PublicKey.findProgramAddressSync(
        [Buffer.from("squad"), currentAuth.toBuffer(), new Uint8Array([0, 0, 0, 0]), Buffer.from("vault")],
        SQUADS_PROGRAM_ID
      );

      // We must also resolve dispute if it's disputed, which it is from previous test!
      if (Object.keys(accountData.status)[0] === "disputed") {
          const resolveIx = await program.methods.resolveDispute()
            .accounts({
                landAccount: landAccountPda,
                multisig: currentAuth,
                multisigSigner: currentMultisigSigner,
            } as any)
            .instruction();
          await executeViaMultisig(resolveIx, currentAuth, currentMultisigSigner);
      }

      const status = (await program.account.landAccount.fetch(landAccountPda)).status;
      if (Object.keys(status)[0] === "locked") {
          const unlockIx = await program.methods.unlockParcel()
            .accounts({
                landAccount: landAccountPda,
                multisig: currentAuth,
                multisigSigner: currentMultisigSigner,
            } as any)
            .instruction();
          await executeViaMultisig(unlockIx, currentAuth, currentMultisigSigner);
      }

      const lockIx = await program.methods.lockParcel()
          .accounts({
              landAccount: landAccountPda,
              multisig: currentAuth,
              multisigSigner: currentMultisigSigner,
          } as any)
          .instruction();

      await executeViaMultisig(lockIx, currentAuth, currentMultisigSigner);

      const account = await program.account.landAccount.fetch(landAccountPda);
      expect(Object.keys(account.status)[0]).to.equal("locked");
    });
  });

  it("Demo Flow Complete", async () => {
    console.log("\n--- DEMO COMPLETE ---");
    console.log("Squads multisig integration verified.");
  });
});
