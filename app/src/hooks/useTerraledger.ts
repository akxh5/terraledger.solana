import { useMemo } from "react";
import { useAnchorProvider } from "./useAnchorProvider";
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor";
import { Terraledger } from "../lib/anchor/terraledger";
import idl from "../lib/anchor/terraledger.json";
import { Connection, PublicKey } from "@solana/web3.js";

export function useTerraledger() {
  const walletProvider = useAnchorProvider();

  const program = useMemo(() => {
    // If we have a wallet, use the wallet provider
    if (walletProvider) {
      return new Program(idl as Idl, walletProvider) as unknown as Program<Terraledger>;
    }

    // Fallback: Read-only provider for walletless mode
    const connection = new Connection(
      import.meta.env.VITE_RPC_ENDPOINT || "https://api.devnet.solana.com",
      "confirmed"
    );
    
    // Create a dummy provider that only supports read operations
    const readOnlyProvider = new AnchorProvider(
        connection,
        {
            publicKey: PublicKey.default,
            signAllTransactions: async (txs) => txs,
            signTransaction: async (tx) => tx,
        } as any,
        { preflightCommitment: "confirmed" }
    );

    return new Program(idl as Idl, readOnlyProvider) as unknown as Program<Terraledger>;
  }, [walletProvider]);

  return { program };
}
