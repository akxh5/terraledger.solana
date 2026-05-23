import { useMemo, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import * as multisig from "@sqds/multisig";

export type Role = 'owner' | 'verifier' | 'authority';

export function useRoles() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { parcels, isLoading: isParcelsLoading } = useParcels();
  const [isAuthorityLoading, setIsAuthorityLoading] = useState(false);
  const [authorityParcels, setAuthorityParcels] = useState<Parcel[]>([]);

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

      setIsAuthorityLoading(true);
      try {
        const uniqueAuthorities = Array.from(new Set(parcels.map(p => p.registrarAuthority)));
        
        const results = await Promise.all(uniqueAuthorities.map(async (authAddr) => {
          try {
            if (!authAddr || authAddr === "11111111111111111111111111111111") return [];
            const multisigPda = new PublicKey(authAddr);
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
          } catch (err) {
            // Silently fail for individual multisig fetches
          }
          return [];
        }));

        setAuthorityParcels(results.flat());
      } catch (err) {
        console.error("Error checking authority roles:", err);
      } finally {
        setIsAuthorityLoading(false);
      }
    };

    checkAuthority();
  }, [parcels, walletStr, publicKey, connection]);

  const roles = useMemo(() => {
    const r: Role[] = [];
    if (ownedParcels.length > 0) r.push('owner');
    if (verifierParcels.length > 0) r.push('verifier');
    if (authorityParcels.length > 0) r.push('authority');
    return r;
  }, [ownedParcels, verifierParcels, authorityParcels]);

  return {
    isOwner: ownedParcels.length > 0,
    isVerifier: verifierParcels.length > 0,
    isAuthority: authorityParcels.length > 0,
    isLoading: isParcelsLoading || isAuthorityLoading,
    roles,
    ownedParcels,
    verifierParcels,
    authorityParcels,
  };
}
