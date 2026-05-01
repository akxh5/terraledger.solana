import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("terraledger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const owner = provider.wallet;
  // Use payer for direct web3.js calls
  const payer = (provider.wallet as any).payer as Keypair;
  
  const newOwner = anchor.web3.Keypair.generate();
  const verifier = anchor.web3.Keypair.generate();

  // Mock Squads Multisig Setup
  const SQUADS_PROGRAM_ID = new PublicKey("SQDS4H8Eq9XfSsk9yHWh879T39f97R9FmUWh553Z2rT");
  const multisigAccount = Keypair.generate();
  const multisigSigner = Keypair.generate();

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
    ownerOverride: PublicKey = SQUADS_PROGRAM_ID
  ) {
    const size = 8 + 32 + 32 + 2 + 4 + (memberCount * 34) + 1;
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(size);
    
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: keypair.publicKey,
        lamports,
        space: size,
        programId: SystemProgram.programId,
      })
    );
    await sendAndConfirmTransaction(provider.connection, tx, [payer, keypair]);

    // Manual data write (minimal valid state for our checks)
    const data = Buffer.alloc(size);
    data.writeUInt16LE(threshold, 72);
    data.writeUInt32LE(memberCount, 74);
    
    // Assign to Squads program
    const assignTx = new Transaction().add(
        SystemProgram.assign({
            accountPubkey: keypair.publicKey,
            programId: ownerOverride,
        })
    );
    await sendAndConfirmTransaction(provider.connection, assignTx, [payer]);
  }

  before(async () => {
    const sig1 = await provider.connection.requestAirdrop(newOwner.publicKey, 1000000000);
    await provider.connection.confirmTransaction(sig1);
    const sig2 = await provider.connection.requestAirdrop(verifier.publicKey, 1000000000);
    await provider.connection.confirmTransaction(sig2);
    const sig3 = await provider.connection.requestAirdrop(multisigSigner.publicKey, 1000000000);
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

  it("register_land: fails if multisig threshold != 2", async () => {
    const badMultisig = Keypair.generate();
    await createMockMultisig(badMultisig, 3, 3);
    const lid = `bad_t_${Date.now()}`;
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("land"), Buffer.from(lid)], program.programId);
    
    try {
      await program.methods.registerLand(lid, "hash", [{owner: owner.publicKey, sharesBps: 10000}], [verifier.publicKey], 1000)
        .accounts({ landAccount: pda, multisig: badMultisig.publicKey, signer: owner.publicKey } as any).rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidMultisigThreshold");
    }
  });

  it("register_land: fails if multisig member count != 3", async () => {
    const badMultisig = Keypair.generate();
    await createMockMultisig(badMultisig, 2, 2);
    const lid = `bad_m_${Date.now()}`;
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("land"), Buffer.from(lid)], program.programId);
    
    try {
      await program.methods.registerLand(lid, "hash", [{owner: owner.publicKey, sharesBps: 10000}], [verifier.publicKey], 1000)
        .accounts({ landAccount: pda, multisig: badMultisig.publicKey, signer: owner.publicKey } as any).rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidMultisigMembers");
    }
  });

  it("register_land: fails if multisig not owned by Squads program", async () => {
    const badMultisig = Keypair.generate();
    await createMockMultisig(badMultisig, 2, 3, SystemProgram.programId);
    const lid = `bad_o_${Date.now()}`;
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("land"), Buffer.from(lid)], program.programId);
    
    try {
      await program.methods.registerLand(lid, "hash", [{owner: owner.publicKey, sharesBps: 10000}], [verifier.publicKey], 1000)
        .accounts({ landAccount: pda, multisig: badMultisig.publicKey, signer: owner.publicKey } as any).rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("InvalidMultisigOwner");
    }
  });

  it("lock_parcel: succeeds when called through correct multisig", async () => {
    await program.methods.lockParcel()
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner.publicKey,
        } as any)
        .signers([multisigAccount, multisigSigner])
        .rpc();

    const account = await program.account.landAccount.fetch(landAccountPda);
    expect(Object.keys(account.status)[0]).to.equal("locked");
  });

  it("lock_parcel: fails when called with wrong multisig PDA", async () => {
    const wrongMultisig = Keypair.generate();
    await createMockMultisig(wrongMultisig, 2, 3);
    
    await program.methods.unlockParcel()
        .accounts({ landAccount: landAccountPda, multisig: multisigAccount.publicKey, multisigSigner: multisigSigner.publicKey } as any)
        .signers([multisigAccount, multisigSigner]).rpc();

    try {
      await program.methods.lockParcel()
        .accounts({ landAccount: landAccountPda, multisig: wrongMultisig.publicKey, multisigSigner: multisigSigner.publicKey } as any)
        .signers([wrongMultisig, multisigSigner]).rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("UnauthorizedMultisig");
    }
  });

  it("resolve_dispute: succeeds through multisig after dispute raised", async () => {
      await program.methods.raiseDispute().accounts({ landAccount: landAccountPda, signer: owner.publicKey } as any).rpc();
      
      await program.methods.resolveDispute()
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner.publicKey,
        } as any)
        .signers([multisigAccount, multisigSigner])
        .rpc();

      const account = await program.account.landAccount.fetch(landAccountPda);
      expect(Object.keys(account.status)[0]).to.equal("active");
  });

  it("transfer_authority: transfers to new multisig PDA", async () => {
      const newMultisig = Keypair.generate();
      await createMockMultisig(newMultisig, 2, 3);

      await program.methods.transferAuthority(newMultisig.publicKey)
        .accounts({
            landAccount: landAccountPda,
            multisig: multisigAccount.publicKey,
            multisigSigner: multisigSigner.publicKey,
        } as any)
        .signers([multisigAccount, multisigSigner])
        .rpc();

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

      try {
        await program.methods.updateVerifiers([verifier.publicKey])
            .accounts({
                landAccount: landAccountPda,
                multisig: currentAuth,
                multisigSigner: multisigSigner.publicKey,
            } as any)
            .signers([multisigSigner])
            .rpc();
        expect.fail("Should have failed");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("ParcelIsDisputed");
      }
  });

  it("Demo Flow Complete", async () => {
    console.log("\n--- DEMO COMPLETE ---");
    console.log("Squads multisig integration verified.");
  });
});
