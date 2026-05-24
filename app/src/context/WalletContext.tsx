import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { DevWalletAdapter } from "@/lib/DevWallet";

// Use a more reliable RPC if Helius API key is provided
const HELIUS_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const ENDPOINT = HELIUS_KEY 
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : clusterApiUrl("devnet");

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
