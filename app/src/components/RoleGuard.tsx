import React, { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRoles, Role } from "@/hooks/useRoles";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { useWalletModal } from "@/hooks/useWalletModal";

interface RoleGuardProps {
  children: ReactNode;
  role: Role;
}

export function RoleGuard({ children, role }: RoleGuardProps) {
  const { connected, publicKey } = useWallet();
  const { openModal } = useWalletModal();
  const rolesData = useRoles();
  const { roles, isLoading } = rolesData;

  // DEMO ONLY: Allow DevWallet to bypass all role checks
  const DEV_WALLET_PUBKEY = '8d4AWN8TmG76FUsEzJWmNPvM8PiwGckaDKKZVEnesEyp';
  if (publicKey?.toString() === DEV_WALLET_PUBKEY) {
    return <>{children}</>;
  }

  const memoizedChildren = React.useMemo(() => children, [children]);

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldAlert className="text-primary" size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Please connect your wallet to access the {role} area of TerraLedger.
        </p>
        <Button onClick={openModal}>Connect Wallet</Button>
      </div>
    );
  }

  // For owner role, we allow access if connected so they can register their first parcel
  const hasRole = role === 'owner' ? connected : roles.includes(role);

  if (isLoading && !hasRole) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-muted-foreground animate-pulse">Checking your on-chain permissions...</p>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldAlert className="text-destructive" size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Permission Denied</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          You don't have the <span className="text-foreground font-bold uppercase">{role}</span> role on-chain. 
          {role === 'owner' && " You need to be a stakeholder in at least one parcel."}
          {role === 'verifier' && " You need to be an approved verifier for at least one parcel."}
          {role === 'authority' && " You need to be a member of a multisig governing at least one parcel."}
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Return Home
        </Button>
      </div>
    );
  }

  return <>{memoizedChildren}</>;
}
