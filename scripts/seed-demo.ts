import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
    PublicKey, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    Connection,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

async function main() {
    const seedPhrase = "terraledger demo wallet seed phrase for recording";
    const seed = crypto.createHash('sha256').update(seedPhrase).digest();
    const demoWallet = Keypair.fromSeed(seed);
    
    console.log("--- TERRA LEDGER DEMO SEEDING ---");
    console.log("Demo Wallet Pubkey:", demoWallet.publicKey.toBase58());

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Check balance
    let balance = await connection.getBalance(demoWallet.publicKey);
    console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
        console.log("Airdropping 2 SOL...");
        try {
            const signature = await connection.requestAirdrop(demoWallet.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);
            balance = await connection.getBalance(demoWallet.publicKey);
            console.log(`New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        } catch (e) {
            console.warn("Airdrop failed, but will attempt to proceed if balance > 0.");
            if (balance === 0) throw new Error("Wallet has no funds and airdrop failed.");
        }
    }

    // Set up Anchor
    const wallet = new anchor.Wallet(demoWallet);
    const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
    anchor.setProvider(provider);

    const idlPath = path.resolve(__dirname, "../app/src/lib/anchor/terraledger.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const programId = new PublicKey("FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM");
    const program = new Program(idl, provider) as any;

    const squadsProgramId = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

    // 1. Create/Get Multisig (1-of-1)
    const multisigCreateSeed = crypto.createHash('sha256').update("terraledger demo multisig create key").digest();
    const multisigCreateKeypair = Keypair.fromSeed(multisigCreateSeed);
    
    const [multisigPda] = multisig.getMultisigPda({
        createKey: multisigCreateKeypair.publicKey,
        programId: squadsProgramId
    });

    console.log("Multisig PDA:", multisigPda.toBase58());

    let multisigExists = false;
    try {
        await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
        multisigExists = true;
        console.log("Multisig already exists.");
    } catch (e) {
        console.log("Creating 1-of-1 Squads Multisig (V2)...");
        try {
            // Treasury on Devnet for Squads v4
            const treasury = new PublicKey("HM5y4mz3Bt9JY9mr1hkyhnvqxSH4H2u2451j7Hc2dtvK");
            
            const createIx = multisig.instructions.multisigCreateV2({
                createKey: multisigCreateKeypair.publicKey,
                configAuthority: null,
                threshold: 1,
                members: [
                    { key: demoWallet.publicKey, permissions: multisig.types.Permissions.all() },
                ],
                timeLock: 0,
                programId: squadsProgramId,
                creator: demoWallet.publicKey,
                multisigPda,
                treasury,
                rentCollector: null
            });
            
            const tx = new Transaction().add(createIx);
            const sig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [demoWallet, multisigCreateKeypair]);
            console.log("Multisig Created! Signature:", sig);
            multisigExists = true;
        } catch (e3: any) {
            console.error("Failed to create multisig:", e3.message);
            console.log("Proceeding anyway, but registration might fail if multisig doesn't exist.");
        }
    }

    // Vault PDA helper
    const [multisigSigner] = PublicKey.findProgramAddressSync(
        [Buffer.from("squad"), multisigPda.toBuffer(), Buffer.from([0,0,0,0]), Buffer.from("vault")],
        squadsProgramId
    );

    // 2. Register Parcel 1 (New Delhi)
    const parcel1Id = "TL-28.613940-77.209021";
    const [land1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(parcel1Id)],
        program.programId
    );

    console.log(`Checking Parcel 1: ${parcel1Id} (${land1Pda.toBase58()})...`);
    let parcel1Account: any = null;
    try {
        parcel1Account = await program.account["landAccount"].fetch(land1Pda);
        console.log("Parcel 1 already exists. Status:", Object.keys(parcel1Account.status)[0]);
    } catch (e) {
        console.log("Registering Parcel 1...");
        const sig = await program.methods
            .registerLand(
                parcel1Id,
                "QmTerraLedgerDemoDocument2025IndiaNewDelhi",
                [{ owner: demoWallet.publicKey, sharesBps: 10000 }],
                [demoWallet.publicKey],
                1000
            )
            .accounts({
                landAccount: land1Pda,
                multisig: multisigPda,
                multisigSigner,
                signer: demoWallet.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
        console.log("Parcel 1 Registered! Signature:", sig);
        parcel1Account = await program.account["landAccount"].fetch(land1Pda);
    }

    // Activate Parcel 1 if Pending
    if (parcel1Account && parcel1Account.status.pendingVerification) {
        console.log("Activating Parcel 1...");
        const sig = await program.methods
            .activateParcel()
            .accounts({
                landAccount: land1Pda,
                verifier: demoWallet.publicKey,
            } as any)
            .rpc();
        console.log("Parcel 1 Activated! Signature:", sig);
    }

    // 3. Register Parcel 2 (Hyderabad)
    const parcel2Id = "TL-17.385044-78.486671";
    const [land2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(parcel2Id)],
        program.programId
    );

    console.log(`Checking Parcel 2: ${parcel2Id} (${land2Pda.toBase58()})...`);
    try {
        const parcel2Account = await program.account["landAccount"].fetch(land2Pda);
        console.log("Parcel 2 already exists. Status:", Object.keys(parcel2Account.status)[0]);
    } catch (e) {
        console.log("Registering Parcel 2...");
        const sig = await program.methods
            .registerLand(
                parcel2Id,
                "QmTerraLedgerDemoDocument2025IndiaNewDelhi", // reusing dummy CID as requested or similar
                [{ owner: demoWallet.publicKey, sharesBps: 10000 }],
                [demoWallet.publicKey],
                1000
            )
            .accounts({
                landAccount: land2Pda,
                multisig: multisigPda,
                multisigSigner,
                signer: demoWallet.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
        console.log("Parcel 2 Registered! Signature:", sig);
    }

    console.log("\n--- SEEDING COMPLETE ---");
    console.log("New Delhi Parcel (Active):", land1Pda.toBase58());
    console.log("Hyderabad Parcel (Pending):", land2Pda.toBase58());
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
