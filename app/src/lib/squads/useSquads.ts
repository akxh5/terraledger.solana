import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

export function useSquads() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const SQUADS_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

  /**
   * Create a new Squads multisig with the connected wallet as the sole member.
   * Returns the multisig PDA.
   *
   * Note: multisigCreate() requires Keypair signers internally, so we build
   * the instruction manually and sign with the wallet adapter.
   */
  const createRegistrarMultisig = async (
    members: PublicKey[],
    threshold: number
  ): Promise<PublicKey> => {
    if (!publicKey || !signTransaction) throw new Error("Wallet not connected");

    // createKey is a throwaway ephemeral keypair that seeds the multisig PDA
    const createKey = Keypair.generate();

    const [multisigPda] = multisig.getMultisigPda({
      createKey: createKey.publicKey,
      programId: SQUADS_PROGRAM_ID,
    });

    // Build the multisigCreate instruction (not the full RPC call)
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const [programConfigPda] = multisig.getProgramConfigPda({ programId: SQUADS_PROGRAM_ID });
    const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(connection, programConfigPda);

    const ix = multisig.instructions.multisigCreateV2({
      createKey: createKey.publicKey,
      creator: publicKey,
      multisigPda,
      configAuthority: null,
      threshold,
      members: members.map((m) => ({
        key: m,
        permissions: multisig.types.Permissions.all(),
      })),
      timeLock: 0,
      rentCollector: null,
      treasury: programConfig.treasury,
      memo: "TerraLedger registrar",
      programId: SQUADS_PROGRAM_ID,
    });

    // Build a v0 transaction with the wallet as fee payer
    const message = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    // Sign: wallet adapter signs for the fee payer; createKey signs as the seed account
    const signed = await signTransaction(tx);
    signed.sign([createKey]); // add createKey signature

    const signature = await connection.sendTransaction(signed);
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    return multisigPda;
  };

  /**
   * Execute a privileged instruction via a Squads multisig vault transaction.
   * Full flow: vaultTransactionCreate → proposalCreate → proposalApprove → vaultTransactionExecute.
   * For a 1-of-1 multisig this executes atomically from the wallet's perspective.
   */
  const executePrivilegedInstruction = async (
    multisigPda: PublicKey,
    instruction: import("@solana/web3.js").TransactionInstruction
  ): Promise<string> => {
    if (!publicKey || !signTransaction) throw new Error("Wallet not connected");

    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigPda
    );
    const transactionIndex = BigInt(multisigAccount.transactionIndex.toString()) + 1n;

    const { blockhash: bh1, lastValidBlockHeight: lvbh1 } = await connection.getLatestBlockhash();
    const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0, programId: SQUADS_PROGRAM_ID });

    // Build the inner vault transaction message
    const innerMessage = new TransactionMessage({
      payerKey: vaultPda,
      recentBlockhash: bh1,
      instructions: [instruction],
    });

    const createIx = multisig.instructions.vaultTransactionCreate({
      multisigPda,
      transactionIndex,
      creator: publicKey,
      vaultIndex: 0,
      ephemeralSigners: 0,
      transactionMessage: innerMessage,
      programId: SQUADS_PROGRAM_ID,
    });

    const proposeIx = multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex,
      creator: publicKey,
      programId: SQUADS_PROGRAM_ID,
    });

    const approveIx = multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex,
      member: publicKey,
      programId: SQUADS_PROGRAM_ID,
    });

    const ixs = [createIx, proposeIx, approveIx];

    const executeIx = await multisig.instructions.vaultTransactionExecute({
      connection,
      multisigPda,
      transactionIndex,
      member: publicKey,
      programId: SQUADS_PROGRAM_ID,
    });
    ixs.push(executeIx);

    // Batch all instructions into a single v0 tx for efficiency
    try {
      const batchMsg = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: bh1,
        instructions: ixs,
      }).compileToV0Message();
      const batchTx = new VersionedTransaction(batchMsg);
      const signed = await signTransaction(batchTx);
      const sig = await connection.sendTransaction(signed);
      await connection.confirmTransaction({ signature: sig, blockhash: bh1, lastValidBlockHeight: lvbh1 }, "confirmed");
      return sig;
    } catch {
      // Fallback: send each instruction as its own transaction (if tx is too large)
      const send = async (instructionList: import("@solana/web3.js").TransactionInstruction[]) => {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const msg = new TransactionMessage({ payerKey: publicKey, recentBlockhash: blockhash, instructions: instructionList }).compileToV0Message();
        const tx = new VersionedTransaction(msg);
        const signed = await signTransaction(tx);
        const sig = await connection.sendTransaction(signed);
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
        return sig;
      };
      
      await send([createIx]);
      await send([proposeIx]);
      await send([approveIx]);
      
      return await send([executeIx]);
    }
  };

  return { createRegistrarMultisig, executePrivilegedInstruction };
}
