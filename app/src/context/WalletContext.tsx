import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { DevWalletAdapter } from "@/lib/DevWallet";

// Devnet is fast and unrestricted — swap to mainnet-beta only when you need
// to broadcast real transactions. Wallet detection/connect does NOT require
// a live RPC call; the endpoint is only used for on-chain reads/writes.
const ENDPOINT = clusterApiUrl("devnet");

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  // Phantom, Solflare, Backpack and other modern wallets implement the
  // Wallet Standard and are detected automatically by WalletProvider —
  // no manual adapter registration required.
  const wallets = useMemo(() => [new DevWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
