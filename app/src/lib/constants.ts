import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM");

/**
 * Devnet verifier wallet — this keypair is pre-approved in the contract's
 * initial_verifiers list.  On devnet we use the connected wallet itself as
 * the verifier so a single Phantom/Solflare wallet can both register AND
 * activate parcels without a second signer.  Override via VITE_VERIFIER_PUBKEY.
 *
 * HOW IT WORKS: register_land accepts any list of initial_verifiers.  We pass
 * [wallet.publicKey] so the registering wallet is also the approved verifier.
 * activate_parcel then signs with the same wallet.
 */
export const DEVNET_VERIFIER_PUBKEY_STR =
  import.meta.env.VITE_VERIFIER_PUBKEY ?? null; // null → use connected wallet

export const SOLANA_EXPLORER_BASE = "https://explorer.solana.com";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs";
