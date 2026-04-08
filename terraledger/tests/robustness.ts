import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { expect } from "chai";

describe("terraledger robustness", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const owner = provider.wallet;
  const unauthorizedUser = anchor.web3.Keypair.generate();

  const landId = `rob_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const metadataHash = "QmTestHash_TerraLedger_Robustness";

  const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("land"), Buffer.from(landId)],
    program.programId
  );

  before(async () => {
    // Airdrop to unauthorizedUser if needed, but not needed for signing if we don't use it as payer
    // But we need it to sign the transferOwnership transaction as the 'owner' to see it fail.
    const signature = await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);
  });

  it("Should fail to register land with empty landId", async () => {
    const [emptyLandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("land"), Buffer.from("")],
      program.programId
    );
    try {
      await program.methods
        .registerLand("", metadataHash)
        .accounts({
          landAccount: emptyLandPda,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have failed with EmptyLandId");
    } catch (err: any) {
      if (!err.error) {
        console.log("Full error object:", JSON.stringify(err, null, 2));
      }
      expect(err.error.errorCode.code).to.equal("EmptyLandId");
    }
  });

  it("Should fail to derive PDA if landId is > 32 bytes (client-side check)", async () => {
    const longLandId = "a".repeat(33);
    try {
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(longLandId)],
        program.programId
      );
      expect.fail("Should have failed with Max seed length exceeded");
    } catch (err: any) {
      expect(err.message).to.equal("Max seed length exceeded");
    }
  });

  it("Should fail to register land with too long metadataHash (65 chars)", async () => {
    const longMetadataHash = "a".repeat(65);
    try {
      await program.methods
        .registerLand(landId, longMetadataHash)
        .accounts({
          landAccount: landAccountPda,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have failed with MetadataHashTooLong");
    } catch (err: any) {
      if (!err.error) {
        console.log("Full error object:", JSON.stringify(err, null, 2));
      }
      expect(err.error.errorCode.code).to.equal("MetadataHashTooLong");
    }
  });

  it("Should register land successfully", async () => {
    await program.methods
      .registerLand(landId, metadataHash)
      .accounts({
        landAccount: landAccountPda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    // Wait for the account to be registered before moving to next test
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  it("Should fail to register the same land ID twice", async () => {
    try {
      await program.methods
        .registerLand(landId, metadataHash)
        .accounts({
          landAccount: landAccountPda,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have failed because account already exists");
    } catch (err: any) {
        // Anchor usually throws a specific error for account already in use
        expect(err.logs.some((log: string) => log.includes("already in use"))).to.be.true;
    }
  });

  it("Should fail to transfer ownership if signer is not the owner", async () => {
    const newOwner = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .transferOwnership(newOwner.publicKey)
        .accounts({
          landAccount: landAccountPda,
          owner: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have failed with Unauthorized");
    } catch (err: any) {
      if (!err.error) {
        console.log("Full error object:", JSON.stringify(err, null, 2));
      }
      expect(err.error.errorCode.code).to.equal("Unauthorized");
    }
  });

  it("Should transfer ownership successfully when signer is the owner", async () => {
    const newOwner = anchor.web3.Keypair.generate();
    await program.methods
      .transferOwnership(newOwner.publicKey)
      .accounts({
        landAccount: landAccountPda,
        owner: owner.publicKey,
      })
      .rpc();
    
    // Add delay and use confirmed commitment
    await new Promise((resolve) => setTimeout(resolve, 500));
    const landAccount = await program.account.landAccount.fetch(landAccountPda, "confirmed");
    expect(landAccount.owner.toString()).to.equal(newOwner.publicKey.toString());
  });
});
