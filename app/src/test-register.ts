import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import * as multisig from "@sqds/multisig";
import idl from "./lib/anchor/terraledger.json" assert { type: "json" };

async function run() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const secretStr = "[209,1,8,233,189,58,137,74,119,140,39,103,94,186,245,166,244,114,31,195,44,74,219,62,53,39,65,110,139,10,217,192,113,62,75,136,32,111,32,163,20,105,37,155,100,203,171,40,46,55,167,177,205,165,17,150,152,221,190,223,185,32,231,51]";
    const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(secretStr)));
    
    const provider = new AnchorProvider(connection, new Wallet(wallet), { preflightCommitment: "confirmed" });
    const program = new Program(idl as any, provider);

    const parcelId = "TEST-XYZ";
    const ipfsCid = "QmTest123";
    
    const createKey = Keypair.generate();
    const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey, programId: SQUADS_PROGRAM_ID });
    const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0, programId: SQUADS_PROGRAM_ID });
    
    const verifierAddress = wallet.publicKey;

    const [landAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("land"), Buffer.from(parcelId)],
      program.programId
    );
    const [historyAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("history"), landAccountPda.toBuffer(), Buffer.alloc(8)],
      program.programId
    );

    try {
        console.log("Sending register_land to program:", program.programId.toBase58());
        const tx = await program.methods
            .registerLand(parcelId, ipfsCid, [wallet.publicKey], [verifierAddress], 1)
            .accounts({
                landAccount: landAccountPda,
                historyAccount: historyAccountPda,
                multisig: multisigPda,
                multisigSigner: vaultPda,
                verifier: verifierAddress,
                registrar: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
        console.log("Success:", tx);
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.logs) console.error("Logs:", e.logs);
    }
}
run();
