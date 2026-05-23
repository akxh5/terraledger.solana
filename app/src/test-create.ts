import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

async function run() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
    
    const secretStr = "[209,1,8,233,189,58,137,74,119,140,39,103,94,186,245,166,244,114,31,195,44,74,219,62,53,39,65,110,139,10,217,192,113,62,75,136,32,111,32,163,20,105,37,155,100,203,171,40,46,55,167,177,205,165,17,150,152,221,190,223,185,32,231,51]";
    const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(secretStr)));
    
    const createKey = Keypair.generate();

    const [multisigPda] = multisig.getMultisigPda({
      createKey: createKey.publicKey,
      programId: SQUADS_PROGRAM_ID,
    });
    
    const [programConfigPda] = multisig.getProgramConfigPda({ programId: SQUADS_PROGRAM_ID });
    console.log("Fetching program config...");
    const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(connection, programConfigPda);
    console.log("Treasury:", programConfig.treasury.toBase58());

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const ix = multisig.instructions.multisigCreateV2({
      createKey: createKey.publicKey,
      creator: wallet.publicKey,
      multisigPda,
      configAuthority: null,
      threshold: 1,
      members: [{
        key: wallet.publicKey,
        permissions: multisig.types.Permissions.all(),
      }],
      timeLock: 0,
      rentCollector: null,
      treasury: programConfig.treasury,
      memo: "TerraLedger registrar",
      programId: SQUADS_PROGRAM_ID,
    });

    const message = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([wallet, createKey]); 

    try {
        const sig = await connection.sendTransaction(tx);
        console.log("TX Sent! Signature:", sig);
    } catch (e: any) {
        console.error("TX Failed:", e.message);
        if (e.logs) console.error("Logs:", e.logs);
    }
}
run();
