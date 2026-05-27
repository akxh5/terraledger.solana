import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTerraledger } from "@/hooks/useTerraledger";
import { useToast } from "@/hooks/use-toast";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import { useRoles } from "@/hooks/useRoles";
import * as anchor from "@coral-xyz/anchor";
import { ShieldCheck, Clock, ExternalLink, RefreshCw, Wallet, FileText, Users, CheckCircle2, Info, ChevronRight, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { CapTable } from "@/components/CapTable";
import ParcelMapViewer from "@/components/ParcelMapViewer";
import ParcelThumbnail from "@/components/ParcelThumbnail";

export default function VerifierPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { program } = useTerraledger();
  const { toast } = useToast();
  const { openModal } = useWalletModal();
  const { refreshParcels } = useParcels();
  const { verifierParcels, isLoading: rolesLoading } = useRoles();

  const [activating, setActivating] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!selectedParcel) {
        setSelectedMetadata(null);
        return;
      }
      
      setIsLoadingMetadata(true);
      try {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${selectedParcel.ipfsDocument}`);
        if (!response.ok) throw new Error('Not a metadata file');
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.documentCid || data.geoJsonCid) {
            setSelectedMetadata(data);
          } else {
            setSelectedMetadata(null);
          }
        } else {
          setSelectedMetadata(null);
        }
      } catch (err) {
        setSelectedMetadata(null);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedParcel?.pda]);
  const [verifierType, setVerifierType] = useState<string>(() => localStorage.getItem(`verifier_type_${publicKey?.toString()}`) || "Unspecified");

  const pendingParcels = verifierParcels.filter(p => p.status === "PendingVerification");

  const handleUpdateVerifierType = (type: string) => {
    setVerifierType(type);
    if (publicKey) {
      localStorage.setItem(`verifier_type_${publicKey.toString()}`, type);
      toast({ title: "Profile Updated", description: `You are now listed as ${type}.` });
    }
  };

  const handleActivate = async (parcel: Parcel) => {
    if (!program || !publicKey) return;
    setActivating(parcel.pda);
    try {
      const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(parcel.parcelId)],
        program.programId
      );
      const sig = await program.methods
        .activateParcel()
        .accounts({ landAccount: landAccountPda, verifier: publicKey } as any)
        .rpc();
      toast({
        title: "✅ Parcel Activated!",
        description: (
          <a
            href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
            target="_blank" rel="noreferrer"
            className="underline text-primary"
          >
            View on Explorer →
          </a>
        ) as any,
      });
      setTimeout(() => refreshParcels(), 2000);
      setSelectedParcel(null);
    } catch (err) {
      toast({ title: "Activation Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="TerraLedger" className="w-7 h-7" />
            <span className="font-display text-xl font-bold opacity-90">TerraLedger</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Verifier Portal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refreshParcels()} className="h-8 gap-1.5 text-xs">
              <RefreshCw size={13} /> Refresh
            </Button>
            {connected ? (
              <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {publicKey?.toString().slice(0, 4)}…{publicKey?.toString().slice(-4)}
              </span>
            ) : (
              <Button size="sm" onClick={openModal} className="gap-2 h-8">
                <Wallet size={13} /> Connect Wallet
              </Button>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">Owner Dashboard →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div {...fadeUp(0)} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={32} className="text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Assigned Verifications</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Parcels where your wallet is listed as an <span className="text-emerald-400 font-medium">approved verifier</span>. 
                Review documents and ownership structures before activating.
              </p>
            </motion.div>

            {rolesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-2xl" />
                ))}
              </div>
            ) : pendingParcels.length === 0 ? (
              <motion.div {...fadeUp(0.05)} className="liquid-glass rounded-2xl p-12 text-center border border-white/10">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-4 opacity-40" />
                <h2 className="text-xl font-bold mb-2">You're all caught up</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No parcels are currently assigned to you for verification. You'll see them here when stakeholders add you as an approved verifier.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {pendingParcels.map((parcel, idx) => (
                  <motion.div
                    key={parcel.pda}
                    {...fadeUp(0.1 + idx * 0.05)}
                    onClick={() => setSelectedParcel(parcel)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                      selectedParcel?.pda === parcel.pda 
                        ? "bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(0,230,154,0.1)]" 
                        : "liquid-glass border-white/10 hover:border-white/20"
                    }`}
                  >
                    <ParcelThumbnail ipfsCid={parcel.ipfsDocument} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold truncate">{parcel.parcelId}</p>
                          <Badge variant="outline" className="text-[9px] bg-yellow-400/10 text-yellow-400 border-yellow-400/20 whitespace-nowrap">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">Reg {parcel.registeredAt}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Users size={12} /> {parcel.stakeholders.length} Owners</span>
                        <span className="flex items-center gap-1.5"><FileText size={12} /> Document Attached</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <ChevronRight size={16} className={cn("text-muted-foreground transition-transform", selectedParcel?.pda === parcel.pda && "translate-x-1 text-primary")} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Verifier Identity Section */}
            <motion.div {...fadeUp(0.2)} className="liquid-glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} className="text-primary" />
                Verifier Identity
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Status</p>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Authorized Verifier
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-2">Self-Declared Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Licensed Advocate", "Registered Surveyor", "Institutional Entity", "Other"].map(type => (
                      <button
                        key={type}
                        onClick={() => handleUpdateVerifierType(type)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-medium transition-all text-left ${
                          verifierType === type 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-3 italic">
                    Demo only — production would require credential verification.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Selected Parcel Context */}
            {selectedParcel && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="liquid-glass rounded-2xl p-6 border border-primary/20 shadow-2xl sticky top-24"
              >
                <h3 className="text-lg font-bold mb-1 font-mono">{selectedParcel.parcelId}</h3>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Review & Activation</p>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block font-semibold">Stakeholder Split</span>
                    <CapTable stakeholders={selectedParcel.stakeholders} />
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block font-semibold">Geospatial Boundary</span>
                    {selectedMetadata?.geoJsonCid ? (
                      <ParcelMapViewer 
                        geoJsonCid={selectedMetadata.geoJsonCid} 
                        metadata={selectedMetadata}
                        height="180px"
                      />
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/10 text-center">
                        <MapIcon size={20} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                        <p className="text-[10px] text-muted-foreground italic">No boundary data attached.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block font-semibold">Legal Document</span>
                    <a
                      href={`https://ipfs.io/ipfs/${selectedMetadata?.documentCid || selectedParcel.ipfsDocument}`}
                      target="_blank" rel="noreferrer"
                      className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between hover:bg-primary/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <FileText size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Registration Deed</p>
                          <p className="text-[9px] text-muted-foreground font-mono truncate w-24">{selectedMetadata?.documentCid || selectedParcel.ipfsDocument}</p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary" />
                    </a>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                      <p className="text-xs text-emerald-200/80 leading-relaxed italic">
                        "I have reviewed the attached legal documentation and verified that the stakeholders listed above represent the lawful owners of this parcel."
                      </p>
                    </div>
                    <Button 
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20"
                      onClick={() => handleActivate(selectedParcel)}
                      disabled={!!activating}
                    >
                      {activating ? (
                        <><RefreshCw size={18} className="animate-spin" /> Activating...</>
                      ) : (
                        <><ShieldCheck size={18} /> Attest & Activate</>
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                      This action is permanent and recorded on the Solana blockchain.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
