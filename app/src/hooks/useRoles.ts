import { useMemo, useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import * as multisig from "@sqds/multisig";
import { useToast } from "./use-toast";

export type Role = 'owner' | 'verifier' | 'authority';

export function useRoles() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { parcels, isLoading: isParcelsLoading } = useParcels();
  const [isAuthorityLoading, setIsAuthorityLoading] = useState(false);
  const [authorityParcels, setAuthorityParcels] = useState<Parcel[]>([]);
  const { toast } = useToast();

  const lastFetchTime = useRef<number>(0);
  const retryCount = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const walletStr = publicKey?.toString();

  const ownedParcels = useMemo(() => {
    if (!walletStr) return [];
    return parcels.filter(p => p.stakeholders.some(s => s.owner === walletStr));
  }, [parcels, walletStr]);

  const verifierParcels = useMemo(() => {
    if (!walletStr) return [];
    return parcels.filter(p => p.approvedVerifiers.includes(walletStr));
  }, [parcels, walletStr]);

  // Authority check is more complex as it requires fetching multisig accounts
  useEffect(() => {
    const checkAuthority = async () => {
      if (!walletStr || !publicKey || parcels.length === 0) {
        setAuthorityParcels([]);
        return;
      }

      // Rate limiting: check if we fetched recently (within 2 seconds)
      const now = Date.now();
      if (now - lastFetchTime.current < 2000) {
        return;
      }

      setIsAuthorityLoading(true);
      try {
        const uniqueAuthorities = Array.from(new Set(parcels.filter(p => p.registrarAuthority).map(p => p.registrarAuthority)));

        if (uniqueAuthorities.length === 0) {
          setAuthorityParcels([]);
          return;
        }

        const results = await Promise.all(uniqueAuthorities.map(async (authAddr) => {
          try {
            if (!authAddr || authAddr === "11111111111111111111111111111111") return [];
            const multisigPda = new PublicKey(authAddr);
            
            // The actual fetch that might 429
            const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
              connection,
              multisigPda
            );

            if (multisigAccount && Array.isArray(multisigAccount.members)) {
              const isMember = multisigAccount.members.some(m => m.key && m.key.toString() === walletStr);
              if (isMember) {
                return parcels.filter(p => p.registrarAuthority === authAddr);
              }
            }
          } catch (err: any) {
            // Check for 429 rate limiting
            if (err.message?.includes('429') || err.toString().includes('429')) {
                throw err; // Re-throw to handle in the catch block
            }
            // Silently fail for other individual multisig fetches
          }
          return [];
        }));

        setAuthorityParcels(results.flat());
        lastFetchTime.current = Date.now();
        retryCount.current = 0; // Reset on success
      } catch (err: any) {
        console.error("Error checking authority roles:", err);
        
        // Handle 429 with exponential backoff
        if ((err.message?.includes('429') || err.toString().includes('429')) && retryCount.current < 3) {
            retryCount.current++;
            const backoff = Math.pow(2, retryCount.current) * 2000; // 4s, 8s, 16s...
            console.warn(`Rate limited (429). Retrying in ${backoff}ms... (Attempt ${retryCount.current}/3)`);
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                checkAuthority();
            }, backoff);
        } else if (retryCount.current >= 3) {
            toast({
                title: "Network Congested",
                description: "Devnet is under heavy load. Please refresh the page in a few moments.",
                variant: "destructive"
            });
        }
        
        setAuthorityParcels([]);
      } finally {
        setIsAuthorityLoading(false);
      }
    };

    checkAuthority();
    
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [parcels, walletStr, publicKey, connection, toast]);

  const roles = useMemo(() => {
    // DEMO ONLY: DevWallet has all roles
    const DEV_WALLET_PUBKEY = '8d4AWN8TmG76FUsEzJWmNPvM8PiwGckaDKKZVEnesEyp';
    if (walletStr === DEV_WALLET_PUBKEY) {
      return ['owner', 'verifier', 'authority'] as Role[];
    }

    const r: Role[] = [];
    if (ownedParcels.length > 0) r.push('owner');
    if (verifierParcels.length > 0) r.push('verifier');
    if (authorityParcels.length > 0) r.push('authority');
    return r;
  }, [ownedParcels, verifierParcels, authorityParcels, walletStr]);

  const isDevWallet = walletStr === '8d4AWN8TmG76FUsEzJWmNPvM8PiwGckaDKKZVEnesEyp';

  return {
    isOwner: isDevWallet || ownedParcels.length > 0,
    isVerifier: isDevWallet || verifierParcels.length > 0,
    isAuthority: isDevWallet || authorityParcels.length > 0,
    isLoading: isParcelsLoading || isAuthorityLoading,
    roles,
    ownedParcels,
    verifierParcels,
    authorityParcels,
  };
}
