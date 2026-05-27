import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRoles } from "@/hooks/useRoles";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import { useSquads } from "@/lib/squads/useSquads";
import { useTerraledger } from "@/hooks/useTerraledger";
import { useToast } from "@/hooks/use-toast";
import * as anchor from "@coral-xyz/anchor";
import { 
  Gavel, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Users, 
  AlertTriangle, 
  ExternalLink, 
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Wallet,
  ShieldAlert,
  Loader2,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { CapTable } from "@/components/CapTable";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  Active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  PendingVerification: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Locked: "text-destructive bg-destructive/10 border-destructive/20",
  Disputed: "text-orange-500 bg-orange-500/10 border-orange-500/20",
};

import { useDemoMode } from "@/components/DemoMode";

export default function AuthorityPage() {
  const isDemo = useDemoMode();
  const { publicKey, connected } = useWallet();
  const { authorityParcels, roles, isLoading: rolesLoading } = useRoles();
  const { refreshParcels } = useParcels();
  const { executePrivilegedInstruction } = useSquads();
  const { program } = useTerraledger();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAuthorityParcels = useMemo(() => {
    return authorityParcels.filter(p => 
      p.parcelId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [authorityParcels, searchQuery]);

  const groupedParcels = useMemo(() => {
    const groups: Record<Parcel["status"], Parcel[]> = {
      Active: [],
      PendingVerification: [],
      Locked: [],
      Disputed: [],
    };
    filteredAuthorityParcels.forEach(p => groups[p.status].push(p));
    return groups;
  }, [filteredAuthorityParcels]);
const handleGovernanceAction = async (action: 'lock' | 'unlock' | 'resolve') => {
  if (!program || !selectedParcel || !publicKey) return;

  // DEMO ONLY: Bypass Squads flow for DevWallet and simulate success
  const DEV_WALLET_PUBKEY = '8d4AWN8TmG76FUsEzJWmNPvM8PiwGckaDKKZVEnesEyp';
  if (publicKey.toString() === DEV_WALLET_PUBKEY) {
    setIsActionPending(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Optimistic Update for UI simulation
    const nextStatus: Parcel["status"] = action === 'lock' ? 'Locked' : 'Active';
    const updatedParcel = { ...selectedParcel, status: nextStatus };
    setSelectedParcel(updatedParcel);

    toast({ 
      title: "Demo Mode: Governance simulation", 
      description: (
        <div className="space-y-2">
          <p className="text-emerald-400 font-bold">Action Simulated Successfully!</p>
          <p className="text-[10px] opacity-70 italic">In production, this would create a Squads V4 multisig proposal. For this demo, we bypass the transaction to ensure stability.</p>
        </div>
      ) as any
    });

    setIsActionPending(false);
    setActionReason("");
    
    // Refresh background data
    setTimeout(() => refreshParcels(), 2000);
    return;
  }

  setIsActionPending(true);
    try {
      const multisigPda = new anchor.web3.PublicKey(selectedParcel.registrarAuthority);
      const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("squad"),
          multisigPda.toBuffer(),
          new Uint8Array([0, 0, 0, 0]),
          Buffer.from("vault")
        ],
        new anchor.web3.PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf")
      );

      let ix;
      if (action === 'lock') {
        ix = await program.methods.lockParcel()
          .accounts({
            landAccount: new anchor.web3.PublicKey(selectedParcel.pda),
            multisig: multisigPda,
            multisigSigner: vaultPda,
          } as any)
          .instruction();
      } else if (action === 'resolve') {
        ix = await program.methods.resolveDispute()
          .accounts({
            landAccount: new anchor.web3.PublicKey(selectedParcel.pda),
            multisig: multisigPda,
            multisigSigner: vaultPda,
          } as any)
          .instruction();
      } else if (action === 'unlock') {
        ix = await program.methods.unlockParcel()
          .accounts({
            landAccount: new anchor.web3.PublicKey(selectedParcel.pda),
            multisig: multisigPda,
            multisigSigner: vaultPda,
          } as any)
          .instruction();
      }

      if (!ix) throw new Error("Unsupported action");

      const sig = await executePrivilegedInstruction(multisigPda, ix);
      toast({ 
        title: "Proposal Created", 
        description: (
          <div className="space-y-2">
            <p>Squads v4 proposal submitted via multisig.</p>
            <a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" className="text-primary underline block text-xs">View Proposal Tx →</a>
          </div>
        ) as any
      });
      refreshParcels();
      setActionReason("");
    } catch (err) {
      toast({ title: "Governance Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsActionPending(false);
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
            <span className="ml-2 text-[10px] uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">
              Authority Panel
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refreshParcels()} className="h-8 gap-1.5 text-xs">
              <RefreshCw size={13} /> Sync
            </Button>
            {connected ? (
              <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                {publicKey?.toString().slice(0, 4)}…{publicKey?.toString().slice(-4)}
              </span>
            ) : (
              <Button size="sm" onClick={() => {}} className="gap-2 h-8">
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
        {/* Demo Banner */}
        {!isDemo && (
          <motion.div {...fadeUp(0)} className="mb-8 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">Demo Mode: Authority Access</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are connected as a governance authority. In production, actions require multi-party approval via Squads multisig.
                The current demo uses a <span className="text-purple-400 font-bold">1-of-1 configuration</span> for atomic execution.
              </p>
            </div>
          </motion.div>
        )}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Parcel Overview Panel */}
          <div className="lg:col-span-2 space-y-8">
            <div>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                 <div>
                   <h2 className="text-2xl font-bold tracking-tight mb-2">Governed Registry</h2>
                   <p className="text-sm text-muted-foreground">Parcels secured by your registrar multisig authority.</p>
                 </div>
                 <div className="relative w-full md:w-64">
                   <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/50">
                     <Search size={14} />
                   </div>
                   <Input 
                     placeholder="Search parcels..." 
                     className="pl-9 bg-white/[0.03] border-white/10 h-10 text-xs"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>

               <div className="space-y-6">
                 {(['Disputed', 'Locked', 'Active', 'PendingVerification'] as const).map(status => {
                   const parcels = groupedParcels[status];
                   if (parcels.length === 0) return null;

                   return (
                     <div key={status} className="space-y-3">
                       <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground px-1">{status} Parcels</h3>
                       <div className="grid gap-3">
                         {parcels.map(p => (
                           <motion.div
                             key={p.pda}
                             layoutId={p.pda}
                             onClick={() => setSelectedParcel(p)}
                             className={cn(
                               "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                               selectedParcel?.pda === p.pda 
                                 ? "bg-purple-500/5 border-purple-500/40 shadow-lg shadow-purple-500/5" 
                                 : "liquid-glass border-white/10 hover:border-white/20"
                             )}
                           >
                             <div className="flex items-center gap-4">
                               <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-background border border-border", selectedParcel?.pda === p.pda && "border-purple-500/30")}>
                                 {p.status === 'Active' && <CheckCircle2 className="text-emerald-400" size={18} />}
                                 {p.status === 'Locked' && <Lock className="text-destructive" size={18} />}
                                 {p.status === 'Disputed' && <ShieldAlert className="text-orange-500" size={18} />}
                                 {p.status === 'PendingVerification' && <Clock className="text-yellow-400" size={18} />}
                               </div>
                               <div>
                                 <p className="text-base font-mono font-bold text-foreground">{p.parcelId}</p>
                                 <p className="text-[10px] text-muted-foreground">{p.stakeholders.length} Stakeholders · Registered {p.registeredAt}</p>
                               </div>
                             </div>
                             <ChevronRight size={16} className={cn("text-muted-foreground transition-transform", selectedParcel?.pda === p.pda && "translate-x-1 text-purple-400")} />
                           </motion.div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>

               {authorityParcels.length === 0 && !rolesLoading && (
                 <div className="liquid-glass rounded-2xl p-12 text-center border border-white/10">
                    <Gavel size={40} className="mx-auto text-muted-foreground mb-4 opacity-40" />
                    <h2 className="text-xl font-bold mb-2">No governed parcels</h2>
                    <p className="text-sm text-muted-foreground">Your multisig doesn't appear as a registrar authority on any parcels.</p>
                 </div>
               )}
            </div>
          </div>

          {/* Governance Actions Panel */}
          <aside className="space-y-6">
            <AnimatePresence mode="wait">
              {selectedParcel ? (
                <motion.div
                  key={selectedParcel.pda}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="liquid-glass rounded-2xl p-6 border border-purple-500/20 shadow-2xl sticky top-24"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-lg font-bold font-mono">{selectedParcel.parcelId}</h3>
                       <Badge className={cn("text-[9px] uppercase mt-1", STATUS_COLORS[selectedParcel.status])}>{selectedParcel.status}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedParcel(null)} className="h-8 w-8 p-0">
                       <LayoutDashboard size={14} />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block font-semibold">Stakeholder Split</Label>
                      <CapTable stakeholders={selectedParcel.stakeholders} />
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                       <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <Gavel size={14} className="text-purple-400" />
                          Governance Actions
                       </h4>

                       {selectedParcel.status === 'Active' && (
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label className="text-[10px] text-muted-foreground uppercase">Reason for Lock</Label>
                               <Input 
                                 placeholder="e.g. Pending litigation..." 
                                 value={actionReason}
                                 onChange={(e) => setActionReason(e.target.value)}
                                 className="text-xs bg-white/5 border-white/10"
                               />
                            </div>
                            <Button 
                              variant="destructive" 
                              className="w-full gap-2 text-xs font-bold bg-destructive/80 hover:bg-destructive"
                              onClick={() => handleGovernanceAction('lock')}
                              disabled={isActionPending || !actionReason}
                            >
                              {isActionPending ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
                              Lock Property Account
                            </Button>
                            <p className="text-[9px] text-muted-foreground italic text-center">
                              Freezes all transfers and document updates.
                            </p>
                         </div>
                       )}

                       {selectedParcel.status === 'Disputed' && (
                         <div className="space-y-4">
                            <Button 
                              className="w-full gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleGovernanceAction('resolve')}
                              disabled={isActionPending}
                            >
                              {isActionPending ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                              Resolve & Activate
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="w-full gap-2 text-xs font-bold"
                              onClick={() => handleGovernanceAction('lock')}
                              disabled={isActionPending}
                            >
                              <Lock size={14} /> Escalate to Locked
                            </Button>
                         </div>
                       )}

                       {selectedParcel.status === 'Locked' && (
                         <Button 
                           variant="outline"
                           className="w-full gap-2 text-xs font-bold border-emerald-500/30 text-emerald-400"
                           onClick={() => handleGovernanceAction('unlock')}
                           disabled={isActionPending}
                         >
                           <Unlock size={14} /> Propose Unlock
                         </Button>
                       )}

                       {selectedParcel.status === 'PendingVerification' && (
                         <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/10 text-center">
                            <Clock className="mx-auto text-yellow-400 mb-2" size={20} />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                               This parcel is awaiting verifier signature. Governance actions will be available once active.
                            </p>
                         </div>
                       )}
                    </div>

                    {/* Multisig Info */}
                    <div className="pt-4 border-t border-white/10">
                       <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 block font-semibold">Multisig Configuration</Label>
                       <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] text-muted-foreground">Threshold</span>
                             <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20">1-of-1 (Demo)</Badge>
                          </div>
                          <div className="space-y-1.5">
                             <p className="text-[9px] text-muted-foreground uppercase">Members</p>
                             <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-bold text-purple-400">1</div>
                                <span className="text-[10px] font-mono truncate">{publicKey?.toString()}</span>
                                <CheckCircle2 size={10} className="text-emerald-500 ml-auto" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="liquid-glass rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center min-h-[300px]"
                >
                  <Gavel size={48} className="text-muted-foreground mb-4 opacity-20" />
                  <p className="text-sm text-muted-foreground italic">Select a parcel to view governance options.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>
    </div>
  );
}
