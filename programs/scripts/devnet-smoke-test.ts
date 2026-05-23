/**
 * Prerequisites:
 * - The multisig must be a 1-of-1 (or the running wallet must be the sole member)
 * - The wallet must have at least 0.1 SOL on devnet
 * - SQUADS_MULTISIG env var must be set to an existing devnet multisig PDA
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
    PublicKey, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    Connection,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import * as fs from "fs";
import * as path from "path";
import { BN } from "bn.js";

async function main() {
    // 0. Configuration & SQUADS_MULTISIG env check
    const multisigAddressStr = process.env.SQUADS_MULTISIG;
    if (!multisigAddressStr) {
        throw new Error("Set SQUADS_MULTISIG env var to your devnet multisig address");
    }
    const multisigPda = new PublicKey(multisigAddressStr);

    // Force devnet connection
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const walletPath = path.resolve(process.env.HOME || "", ".config/solana/id.json");
    const walletKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
    );
    const wallet = new anchor.Wallet(walletKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    // Load IDL locally
    const idlPath = path.resolve(__dirname, "../target/idl/terraledger.json");
    if (!fs.existsSync(idlPath)) {
        console.error("IDL not found at", idlPath, "- Run 'anchor build' first.");
        return;
    }
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const program = new Program(idl, provider);

    console.log("🚀 STARTING DEVNET SMOKE TEST");
    console.log("Wallet:", wallet.publicKey.toBase58());
    console.log("Using Multisig:", multisigPda.toBase58());

    const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    const verifier = Keypair.generate();
    
    // 1. Sanity Check: Fetch Multisig Account
    console.log("\n[1/5] Fetching multisig account state...");
    try {
        const msAccount = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
        console.log("✅ Multisig state fetched successfully");
        console.log(`   Threshold: ${msAccount.threshold}`);
        // In V4 members is not directly a count field in the struct but we can log the length of members if accessible
        // or just log that it exists.
        // multisig.accounts.Multisig in SDK v2.x has members field
    } catch (err: any) {
        console.error("❌ Failed to fetch multisig account. Ensure the PDA is correct and on devnet.");
        return;
    }

    // 2. Derive Vault
    console.log("\n[2/5] Deriving Vault PDA...");
    const [vaultPda] = multisig.getVaultPda({
        multisigPda,
        index: 0,
        programId: SQUADS_PROGRAM_ID
    });
    console.log("✅ Vault PDA:", vaultPda.toBase58());

    // 3. Register Land
    console.log("\n[3/5] Registering test land parcel...");
    const landId = `SMOKE-${Date.now() % 100000}`;
    const [landAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(landId)],
        program.programId
    );

    try {
        await program.methods
            .registerLand(
                landId, 
                "QmSmokeTestHash", 
                [{ owner: wallet.publicKey, sharesBps: 10000 }], 
                [verifier.publicKey], 
                1000
            )
            .accounts({
                landAccount: landAccountPda,
                multisig: multisigPda,
                signer: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
        console.log("✅ Land Registered:", landId);
        console.log("   PDA:", landAccountPda.toBase58());
    } catch (err: any) {
        console.error("❌ Land registration failed:");
        if (err.logs) console.error(err.logs);
        return;
    }

    // 4. Activate Land (required for locking)
    console.log("\n[4/5] Activating land parcel (via Verifier)...");
    // Verifier needs funds
    const airdropSig = await connection.requestAirdrop(verifier.publicKey, 0.01 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);

    try {
        await program.methods
            .activateParcel()
            .accounts({
                landAccount: landAccountPda,
                verifier: verifier.publicKey,
            } as any)
            .signers([verifier])
            .rpc();
        console.log("✅ Land Activated");
    } catch (err: any) {
        console.error("❌ Land activation failed:");
        if (err.logs) console.error(err.logs);
        return;
    }

    // 5. Execute lock_parcel through Squads
    console.log("\n[5/5] Executing lock_parcel through Squads flow...");
    try {
        const lockIx = await program.methods.lockParcel()
            .accounts({
                landAccount: landAccountPda,
                multisig: multisigPda,
                multisigSigner: vaultPda,
            } as any)
            .instruction();
        
        await executeMultisigIx(connection, multisigPda, lockIx, walletKeypair);
        console.log("✅ lock_parcel executed successfully through Squads!");
    } catch (err: any) {
        console.error("❌ lock_parcel execution failed:");
        if (err.logs) console.error(err.logs);
        return;
    }

    console.log("\n✨ SMOKE TEST COMPLETE: REAL SQUADS INTEGRATION VERIFIED");
}

async function executeMultisigIx(
    connection: Connection,
    multisigPda: PublicKey,
    ix: TransactionInstruction,
    payer: Keypair
) {
    const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    
    // Fetch current state
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
    const transactionIndex = BigInt(multisigAccount.transactionIndex.toString()) + BigInt(1);
    
    const latestBlockhash = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: multisigPda,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix]
    });

    // Create proposal
    const createSignature = await multisig.rpc.vaultTransactionCreate({
        connection,
        feePayer: payer,
        multisigPda,
        transactionIndex,
        creator: payer.publicKey,
        vaultIndex: 0,
        ephemeralSigners: 0,
        transactionMessage: message,
        programId: SQUADS_PROGRAM_ID
    });
    await connection.confirmTransaction(createSignature);

    // Approve
    const approveSignature = await multisig.rpc.proposalApprove({
        connection,
        feePayer: payer,
        multisigPda,
        transactionIndex,
        member: payer,
        programId: SQUADS_PROGRAM_ID
    });
    await connection.confirmTransaction(approveSignature);

    // Execute
    const executeSignature = await multisig.rpc.vaultTransactionExecute({
        connection,
        feePayer: payer,
        multisigPda,
        transactionIndex,
        member: payer.publicKey,
        programId: SQUADS_PROGRAM_ID
    });
    await connection.confirmTransaction(executeSignature);
}

main().catch(console.error);
