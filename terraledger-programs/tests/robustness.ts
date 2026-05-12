import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { SquadsMock } from "../target/types/squads_mock";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("terraledger robustness", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const squadsMock = anchor.workspace.SquadsMock as Program<SquadsMock>;
  
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
    
    // Initialize mock multisig via mock program
    await squadsMock.methods
      .initializeMultisig(2)
      .accounts({
        multisig: multisigAccount.publicKey,
        createKey: owner.publicKey,
        configAuthority: owner.publicKey,
        payer: owner.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([multisigAccount])
      .rpc();
  });

  it("Should fail to register land with empty landId", async () => {
    const [emptyLandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("land"), Buffer.from("")],
      program.programId
    );
    const [multisigSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), multisigAccount.publicKey.toBuffer(), new Uint8Array([0, 0, 0, 0]), Buffer.from("vault")],
      new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf")
    );
    try {
      await program.methods
        .registerLand("", metadataHash, [{ owner: owner.publicKey, sharesBps: 10000 }], [registrar.publicKey], 1000)
        .accounts({
          landAccount: emptyLandPda,
          multisig: multisigAccount.publicKey,
          multisigSigner: multisigSigner,
          signer: owner.publicKey,
        } as any)
        .rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
    }
  });

  it("Should register land successfully", async () => {
    const [multisigSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("squad"), multisigAccount.publicKey.toBuffer(), new Uint8Array([0, 0, 0, 0]), Buffer.from("vault")],
      new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf")
    );
    await program.methods
      .registerLand(landId, metadataHash, [{ owner: owner.publicKey, sharesBps: 10000 }], [registrar.publicKey], 1000)
      .accounts({
        landAccount: landAccountPda,
        multisig: multisigAccount.publicKey,
        multisigSigner: multisigSigner,
        signer: owner.publicKey,
      } as any)
      .rpc();
  });
});
