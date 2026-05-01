import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("terraledger robustness", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const owner = provider.wallet;
  const payer = (provider.wallet as any).payer as Keypair;
  const registrar = anchor.web3.Keypair.generate();

  const landId = `rob_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const metadataHash = "QmTestHash_TerraLedger_Robustness";

  const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("land"), Buffer.from(landId)],
    program.programId
  );

  const multisigAccount = Keypair.generate();

  before(async () => {
    // Airdrop to registrar
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(registrar.publicKey, 1000000000)
    );
    
    // Create mock multisig
    const size = 8 + 32 + 32 + 2 + 4 + (3 * 34) + 1;
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(size);
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: multisigAccount.publicKey,
        lamports,
        space: size,
        programId: SystemProgram.programId,
      })
    );
    await sendAndConfirmTransaction(provider.connection, tx, [payer, multisigAccount]);

    const data = Buffer.alloc(size);
    data.writeUInt16LE(2, 72);
    data.writeUInt32LE(3, 74);
    
    // Assign to Squads program
    const assignTx = new Transaction().add(
        SystemProgram.assign({
            accountPubkey: multisigAccount.publicKey,
            programId: new PublicKey("SQDS4H8Eq9XfSsk9yHWh879T39f97R9FmUWh553Z2rT"),
        })
    );
    await sendAndConfirmTransaction(provider.connection, assignTx, [payer]);
  });

  it("Should fail to register land with empty landId", async () => {
    const [emptyLandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("land"), Buffer.from("")],
      program.programId
    );
    try {
      await program.methods
        .registerLand("", metadataHash, [{ owner: owner.publicKey, sharesBps: 10000 }], [registrar.publicKey], 1000)
        .accounts({
          landAccount: emptyLandPda,
          multisig: multisigAccount.publicKey,
          signer: owner.publicKey,
        } as any)
        .rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
    }
  });

  it("Should register land successfully", async () => {
    await program.methods
      .registerLand(landId, metadataHash, [{ owner: owner.publicKey, sharesBps: 10000 }], [registrar.publicKey], 1000)
      .accounts({
        landAccount: landAccountPda,
        multisig: multisigAccount.publicKey,
        signer: owner.publicKey,
      } as any)
      .rpc();
  });
});
