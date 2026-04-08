import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Terraledger } from "../target/types/terraledger";
import { expect } from "chai";

describe("terraledger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Terraledger as Program<Terraledger>;
  const owner = provider.wallet;
  const newOwner = anchor.web3.Keypair.generate();

  // Unique landId to prevent collision on re-runs
  const landId = `land_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const metadataHash = "QmTestHash_TerraLedger_Demo";

  const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("land"), Buffer.from(landId)],
    program.programId
  );

  console.log("--- STARTING TERRALEDGER DEMO ---");
  console.log(`Program ID: ${program.programId.toBase58()}`);
  console.log(`Land PDA:   ${landAccountPda.toBase58()}`);

  it("Registers land with metadata", async () => {
    try {
      const tx = await program.methods
        .registerLand(landId, metadataHash)
        .accounts({
          landAccount: landAccountPda,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\n[STEP 1] Land Registered Successfully");
      console.log(`TX Signature: ${tx}`);

      // Add a small delay to ensure the account is fully initialized before fetching
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch with confirmed commitment for stability
      const landAccount = await program.account.landAccount.fetch(landAccountPda, "confirmed");

      console.log("-----------------------------------------");
      console.log("ON-CHAIN DATA:");
      console.log(`Owner:     ${landAccount.owner.toString()}`);
      console.log(`Land ID:   ${landAccount.landId}`);
      console.log(`Metadata:  ${landAccount.metadataHash}`);
      
      const regTime = landAccount.registeredAt ? landAccount.registeredAt.toString() : "N/A";
      console.log(`Timestamp: ${regTime}`);
      console.log("-----------------------------------------");

      expect(landAccount.owner.toString()).to.equal(owner.publicKey.toString());
    } catch (err) {
      console.error("[ERROR] Registration failed:", err);
      throw err;
    }
  });

  it("Transfers ownership of the land", async () => {
    console.log("\n[STEP 2] Transferring Ownership...");
    console.log(`New Owner: ${newOwner.publicKey.toString()}`);

    try {
      const tx = await program.methods
        .transferOwnership(newOwner.publicKey)
        .accounts({
          landAccount: landAccountPda,
          owner: owner.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      console.log("[RESULT] Ownership Transferred Successfully");
      console.log(`TX Signature: ${tx}`);

      // Add a small delay to ensure the account update is reflected before fetching
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Ensure fetch uses commitment "confirmed" for updated state
      const landAccount = await program.account.landAccount.fetch(
        landAccountPda,
        "confirmed"
      );

      console.log("-----------------------------------------");
      console.log(`Updated Owner: ${landAccount.owner.toString()}`);
      
      const transferTime = landAccount.lastTransferAt ? landAccount.lastTransferAt.toString() : "N/A";
      console.log(`Transfer Timestamp: ${transferTime}`);
      console.log("-----------------------------------------");

      expect(landAccount.owner.toString()).to.equal(newOwner.publicKey.toString());
    } catch (err) {
      console.error("[ERROR] Transfer failed:", err);
      throw err;
    }
  });

  it("Demo Flow Complete", async () => {
    console.log("\n--- DEMO COMPLETE ---");
    console.log("All on-chain states verified successfully.");
  });
});
