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
    VersionedTransaction
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const connection = provider.connection;
    const wallet = (provider.wallet as any).payer as Keypair;

    const idlPath = path.resolve(__dirname, "../../terraledger-genesis-v2/src/lib/anchor/terraledger.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const program = new Program(idl, provider);

    console.log("--- STARTING DEVNET SEEDING ---");
    console.log("Wallet:", wallet.publicKey.toBase58());

    const squadsProgramId = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    const verifier = Keypair.generate();
    
    // Create 2 extra members for the 2-of-3 multisig
    const member2 = Keypair.generate();
    const member3 = Keypair.generate();
    
    console.log("Creating Squads Multisig...");
    const createKeypair = Keypair.generate();
    const [multisigPda] = multisig.getMultisigPda({
        createKey: createKeypair.publicKey,
        programId: squadsProgramId
    });

    // Create multisig
    const createIx = multisig.instructions.multisigCreate({
        createKey: createKeypair.publicKey,
        configAuthority: null,
        threshold: 2,
        members: [
            { key: wallet.publicKey, permissions: multisig.types.Permissions.all() },
            { key: member2.publicKey, permissions: multisig.types.Permissions.all() },
            { key: member3.publicKey, permissions: multisig.types.Permissions.all() },
        ],
        timeLock: 0,
        programId: squadsProgramId,
        creator: wallet.publicKey,
        multisigPda
    });

    try {
        const createTx = new Transaction().add(createIx);
        await anchor.web3.sendAndConfirmTransaction(connection, createTx, [wallet, createKeypair]);
        console.log("Multisig Created:", multisigPda.toBase58());
    } catch (err: any) {
        console.error("Failed to create multisig:");
        if (err.logs) console.error(err.logs);
        throw err;
    }

    const [realVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("squad"), multisigPda.toBuffer(), Buffer.from([0,0,0,0]), Buffer.from("vault")],
        squadsProgramId
    );

    const seedOutput: any = {
        multisig: multisigPda.toBase58(),
        vault: realVaultPda.toBase58(),
        parcels: []
    };

    console.log("Airdropping to verifier...");
    try {
        const verifierAirdrop = await connection.requestAirdrop(verifier.publicKey, 100000000);
        await connection.confirmTransaction(verifierAirdrop);
    } catch (e) {
        console.warn("Verifier airdrop failed, might already have funds or rate limited.");
    }

    const parcels = [
        {
            name: "Greenfield Estate, Plot A",
            id: `TL-GRN-${Date.now() % 10000}`,
            owners: [{ owner: wallet.publicKey, sharesBps: 10000 }],
            history: 3,
            status: "Active"
        },
        {
            name: "Riverside Commercial Zone",
            id: `TL-RIV-${Date.now() % 10000}`,
            owners: [
                { owner: wallet.publicKey, sharesBps: 6000 },
                { owner: member2.publicKey, sharesBps: 4000 }
            ],
            history: 1,
            status: "Disputed",
            disputeReason: "Boundary encroachment claim filed 2024-03-15"
        },
        {
            name: "Heritage Housing Block 7",
            id: `TL-HER-${Date.now() % 10000}`,
            owners: [
                { owner: wallet.publicKey, sharesBps: 3000 },
                { owner: member2.publicKey, sharesBps: 2000 },
                { owner: member3.publicKey, sharesBps: 2000 },
                { owner: Keypair.generate().publicKey, sharesBps: 1500 },
                { owner: Keypair.generate().publicKey, sharesBps: 1500 }
            ],
            history: 5,
            status: "Active"
        },
        {
            name: "Industrial Corridor, Section 3",
            id: `TL-IND-${Date.now() % 10000}`,
            owners: [{ owner: wallet.publicKey, sharesBps: 10000 }],
            history: 2,
            status: "Locked"
        },
        {
            name: "Agricultural Land, Khasra 442",
            id: `TL-AGR-${Date.now() % 10000}`,
            owners: [
                { owner: wallet.publicKey, sharesBps: 3334 },
                { owner: member2.publicKey, sharesBps: 3333 },
                { owner: member3.publicKey, sharesBps: 3333 }
            ],
            history: 1,
            status: "Active",
            ipfs: "QmZ123RealisticHashForTitleDeedDocuments"
        }
    ];

    for (const p of parcels) {
        console.log(`\nSeeding: ${p.name}...`);
        const [landAccountPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("land"), Buffer.from(p.id)],
            program.programId
        );

        // 1. Register
        await program.methods
            .registerLand(
                p.id, 
                p.ipfs || "QmInitialDocumentHash", 
                p.owners, 
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

        // 2. History
        for (let i = 1; i < p.history; i++) {
            const [historyPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("history"), Buffer.from(p.id), Buffer.from(new anchor.BN(i).toArray("le", 8))],
                program.programId
            );
            await program.methods
                .updateDocument(`QmUpdatedHash_V${i+1}`)
                .accounts({
                    landAccount: landAccountPda,
                    historyEntry: historyPda,
                    signer: wallet.publicKey,
                    verifier: verifier.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .signers([verifier])
                .rpc();
        }

        // 3. Status Transitions
        if (p.status === "Active" || p.status === "Disputed" || p.status === "Locked") {
            // Activate first
            await program.methods
                .activateParcel()
                .accounts({
                    landAccount: landAccountPda,
                    verifier: verifier.publicKey,
                } as any)
                .signers([verifier])
                .rpc();
        }

        if (p.status === "Disputed") {
            await program.methods
                .raiseDispute()
                .accounts({
                    landAccount: landAccountPda,
                    signer: wallet.publicKey,
                } as any)
                .rpc();
        }

        if (p.status === "Locked") {
            console.log("  (Proposing Lock via Squads...)");
            const lockIx = await program.methods.lockParcel()
                .accounts({
                    landAccount: landAccountPda,
                    multisig: multisigPda,
                    multisigSigner: realVaultPda,
                } as any)
                .instruction();
            
            await executeMultisigIx(connection, multisigPda, lockIx, wallet, [wallet, member2]);
        }

        seedOutput.parcels.push({
            name: p.name,
            address: landAccountPda.toBase58(),
            status: p.status,
            owners: p.owners.length,
            history: p.history
        });
        console.log(`  Success! Address: ${landAccountPda.toBase58()}`);
    }

    console.log("\n--- SEEDING COMPLETE ---");
    console.table(seedOutput.parcels);

    const outputPath = path.resolve(__dirname, "seed-output.json");
    fs.writeFileSync(outputPath, JSON.stringify(seedOutput, null, 2));
    console.log(`Output saved to ${outputPath}`);
}

async function executeMultisigIx(
    connection: Connection,
    multisigPda: PublicKey,
    ix: TransactionInstruction,
    payer: Keypair,
    signers: Keypair[]
) {
    const squadsProgramId = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
    const transactionIndex = BigInt(multisigAccount.transactionIndex.toString()) + BigInt(1);
    
    const latestBlockhash = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: multisigPda,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix]
    });

    // Create
    const createSignature = await multisig.rpc.vaultTransactionCreate({
        connection,
        feePayer: payer,
        multisigPda,
        transactionIndex,
        creator: payer.publicKey,
        vaultIndex: 0,
        ephemeralSigners: 0,
        transactionMessage: message,
        programId: squadsProgramId
    });
    await connection.confirmTransaction(createSignature);

    // Approve
    for (const signer of signers) {
        await multisig.rpc.proposalApprove({
            connection,
            feePayer: payer,
            multisigPda,
            transactionIndex,
            member: signer,
            programId: squadsProgramId
        });
    }

    // Execute
    const executeSignature = await multisig.rpc.vaultTransactionExecute({
        connection,
        feePayer: payer,
        multisigPda,
        transactionIndex,
        member: payer.publicKey,
        programId: squadsProgramId
    });
    await connection.confirmTransaction(executeSignature);
}

main().catch(console.error);
