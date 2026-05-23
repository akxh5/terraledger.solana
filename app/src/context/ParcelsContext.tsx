import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useTerraledger } from "@/hooks/useTerraledger";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

export interface Stakeholder {
  owner: string;
  sharesBps: number;
}

export interface Parcel {
  parcelId: string;
  stakeholders: Stakeholder[];
  status: "Active" | "PendingVerification" | "Locked" | "Disputed";
  registeredAt: string;
  ipfsDocument: string;
  pda: string;
  registrarAuthority: string;
  approvedVerifiers: string[];
  historyCount: number;
  disputeThresholdBps: number;
}

interface ParcelsContextType {
  parcels: Parcel[];
  isLoading: boolean;
  refreshParcels: () => Promise<void>;
}

const ParcelsContext = createContext<ParcelsContextType | undefined>(undefined);

export function ParcelsProvider({ children }: { children: ReactNode }) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { program } = useTerraledger();
  const { connection } = useConnection();

  const mapAccount = useCallback((acc: any): Parcel => {
    try {
      const data = acc.account;
      const stakeholders = (data.stakeholders || []).map((s: any) => ({
        owner: s.owner?.toString() || "",
        sharesBps: s.sharesBps || s.shares_bps || 0,
      }));
      const statusObj = data.status || {};
      const statusStr: Parcel["status"] = statusObj.pendingVerification
        ? "PendingVerification"
        : statusObj.locked ? "Locked"
        : statusObj.disputed ? "Disputed"
        : "Active";
      return {
        parcelId: data.parcelId || data.parcel_id || "Unknown",
        stakeholders,
        status: statusStr,
        registeredAt: new Date((data.registeredAt?.toNumber() || data.registered_at?.toNumber() || 0) * 1000).toISOString().split("T")[0],
        ipfsDocument: data.ipfsDocument || data.ipfs_document || "",
        pda: acc.publicKey.toString(),
        registrarAuthority: (data.registrarAuthority || data.registrar_authority || "").toString(),
        approvedVerifiers: (data.approvedVerifiers || data.approved_verifiers || []).map((v: any) => v.toString()),
        historyCount: (data.historyCount?.toNumber() || data.history_count?.toNumber() || 0),
        disputeThresholdBps: data.disputeThresholdBps || data.dispute_threshold_bps || 1000,
      };
    } catch (err) {
      console.error("Error mapping parcel account:", err);
      // Return a dummy parcel to avoid crashing the whole list
      return {
        parcelId: "Error",
        stakeholders: [],
        status: "Locked",
        registeredAt: "",
        ipfsDocument: "",
        pda: acc.publicKey.toString(),
        registrarAuthority: "",
        approvedVerifiers: [],
        historyCount: 0,
        disputeThresholdBps: 1000,
      };
    }
  }, []);

  const fetchParcels = useCallback(async () => {
    try {
      if (!program) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const accounts = await program.account.landAccount.all();
      const mapped = accounts.map(mapAccount);
      setParcels(mapped);
    } catch (err) {
      console.error("Error fetching parcels:", err);
    } finally {
      setIsLoading(false);
    }
  }, [program, mapAccount]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Subscribe to changes globally or per-account if needed
  // For simplicity and efficiency, we'll rely on refreshParcels for now
  // or add a global listener if necessary.

  return (
    <ParcelsContext.Provider value={{ parcels, isLoading, refreshParcels: fetchParcels }}>
      {children}
    </ParcelsContext.Provider>
  );
}

export function useParcels() {
  const context = useContext(ParcelsContext);
  if (context === undefined) {
    throw new Error("useParcels must be used within a ParcelsProvider");
  }
  return context;
}
