import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import {
  Search,
  ExternalLink,
  X,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Plus,
  Lock,
  ShieldAlert,
  Trash2,
  Gavel,
  ShieldCheck,
  Users,
  Eye,
  Info,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Zap,
  Loader2,
  History,
  FileText,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerraledger } from "@/hooks/useTerraledger";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import * as anchor from "@coral-xyz/anchor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CapTable } from "@/components/CapTable";
import { useSquads } from "@/lib/squads/useSquads";
import * as squadsMultisig from "@sqds/multisig";
import { uploadToPinata, ipfsUrl, hasPinataCredentials } from "@/lib/pinata";
import { PublicKey } from "@solana/web3.js";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import { useRoles } from "@/hooks/useRoles";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  Active: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  PendingVerification: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  Locked: "text-destructive bg-destructive/10 border border-destructive/20",
  Disputed: "text-orange-500 bg-orange-500/10 border border-orange-500/20",
};

export default function ParcelsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "PendingVerification" | "Disputed" | "Locked">("All");
  const [selected, setSelected] = useState<Parcel | null>(null);
  const { parcels, isLoading, refreshParcels } = useParcels();
  const { ownedParcels, roles } = useRoles();
  const navigate = useNavigate();

  // Tour State
  const [tourStep, setTourStep] = useState<number | null>(null);

  // Registration state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newParcelId, setNewParcelId] = useState("");
  const [newIpfsDocument, setNewIpfsDocument] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [coOwners, setCoOwners] = useState<{ address: string; share: number }[]>([]);
  const [disputeThreshold, setDisputeThreshold] = useState(1000);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCreatingMultisig, setIsCreatingMultisig] = useState(false);
  const [multisigAddress, setMultisigAddress] = useState("");

  // History entries for selected parcel
  const [historyEntries, setHistoryEntries] = useState<{ ipfsHash: string; updatedBy: string; timestamp: number; index: number }[]>([]);
  const [isActivating, setIsActivating] = useState(false);
  
  const [isUpdateDocOpen, setIsUpdateDocOpen] = useState(false);
  const [updateDocFile, setUpdateDocFile] = useState<File | null>(null);
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);

  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transferPercentage, setTransferPercentage] = useState(1);

  // Action state
  const [isPrivilegedActionPending, setIsPrivilegedActionPending] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isRaisingDispute, setIsRaisingDispute] = useState(false);

  const { program } = useTerraledger();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const { executePrivilegedInstruction, createRegistrarMultisig } = useSquads();

  const isReadOnly = !publicKey;

  // Real-time: subscribe to selected parcel PDA via onAccountChange
  useEffect(() => {
    if (!selected || !program || !connection) return;
    const pda = new PublicKey(selected.pda);
    const subId = connection.onAccountChange(pda, (info) => {
      refreshParcels();
    }, "confirmed");
    return () => { connection.removeAccountChangeListener(subId); };
  }, [selected?.pda, program, connection, refreshParcels]);

  // Update selected if parcels change
  useEffect(() => {
    if (selected) {
      const updated = parcels.find(p => p.pda === selected.pda);
      if (updated) setSelected(updated);
    }
  }, [parcels, selected?.pda]);

  // Tour logic
  useEffect(() => {
    const tourSeen = localStorage.getItem("terraledger_tour_seen");
    if (!tourSeen) {
        setTourStep(1);
    }
  }, []);

  const completeTour = () => {
    setTourStep(null);
    localStorage.setItem("terraledger_tour_seen", "true");
  };

  const isValidPubkey = (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  // Derive the Squads vault PDA (index 0) matching the Rust program explicitly
  const getVaultPda = (multisigPda: anchor.web3.PublicKey): anchor.web3.PublicKey => {
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("squad"),
        multisigPda.toBuffer(),
        new Uint8Array([0, 0, 0, 0]),
        Buffer.from("vault")
      ],
      new anchor.web3.PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf")
    );
    return vaultPda;
  };

  const handleCreateMultisig = async () => {
    if (!publicKey) return;
    try {
      setIsCreatingMultisig(true);
      const multisigPda = await createRegistrarMultisig([publicKey], 1);
      setMultisigAddress(multisigPda.toString());
      toast({ title: "✅ Registrar Multisig Provisioned", description: "Standard threshold established." });
    } catch (err) {
      toast({ title: "Multisig creation failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsCreatingMultisig(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey || isReadOnly) return;
    
    // Frontend Validation
    if (!newParcelId || newParcelId.trim() === "") {
      toast({ title: "Invalid Input", description: "Parcel ID is required.", variant: "destructive" });
      return;
    }
    if (!multisigAddress) {
      toast({ title: "Multisig Required", description: "Establish a Registrar Authority first.", variant: "destructive" });
      return;
    }
    if (!docFile && !newIpfsDocument) {
      toast({ title: "Document Required", description: "Upload a file or paste a valid CID.", variant: "destructive" });
      return;
    }
    
    try {
      setIsRegistering(true);
      let cid = newIpfsDocument;
      if (docFile) {
        setIsUploadingDoc(true);
        try {
          cid = hasPinataCredentials()
            ? await uploadToPinata(docFile, newParcelId + '-registration')
            : 'QmTest' + Date.now().toString(36).toUpperCase();
        } finally { setIsUploadingDoc(false); }
      }
      
      const multisigPda = new anchor.web3.PublicKey(multisigAddress);
      const vaultPda = getVaultPda(multisigPda);
      const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('land'), Buffer.from(newParcelId)],
        program.programId
      );
      
      const totalCoOwnerShare = coOwners.reduce((acc, co) => acc + co.share, 0);
      const initialStakeholders = [
        { owner: publicKey, sharesBps: (100 - totalCoOwnerShare) * 100 },
        ...coOwners.map(co => ({
          owner: new anchor.web3.PublicKey(co.address),
          sharesBps: co.share * 100
        }))
      ];
      const initialVerifiers = [publicKey];

      const sig = await program.methods
        .registerLand(newParcelId, cid, initialStakeholders, initialVerifiers, disputeThreshold)
        .accounts({
          landAccount: landAccountPda,
          multisig: multisigPda,
          multisigSigner: vaultPda,
          signer: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();

      toast({
        title: '✅ Registered on-chain!',
        description: (<a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target='_blank' rel='noreferrer' className='underline text-primary'>View on Explorer →</a>) as any,
      });

      setIsRegisterModalOpen(false);
      setNewParcelId(''); setNewIpfsDocument(''); setDocFile(null); setMultisigAddress('');
      setTimeout(() => refreshParcels(), 3000);
    } catch (err) {
      toast({ title: 'Registration Failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleActivateParcel = async () => {
    if (!program || !publicKey || !selected) return;
    try {
      setIsActivating(true);
      const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("land"), Buffer.from(selected.parcelId)],
        program.programId
      );
      const sig = await program.methods
        .activateParcel()
        .accounts({ landAccount: landAccountPda, verifier: publicKey } as any)
        .rpc();
      toast({
        title: "✅ Parcel Activated!",
        description: (<a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline text-primary">View on Explorer →</a>) as any,
      });
      setTimeout(() => refreshParcels(), 3000);
    } catch (err) {
      toast({ title: "Activation Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsActivating(false);
    }
  };

  const fetchHistory = useCallback(async (parcel: Parcel) => {
    if (!program || parcel.historyCount === 0) { setHistoryEntries([]); return; }
    try {
      const entries = await Promise.all(
        Array.from({ length: parcel.historyCount }, async (_, i) => {
          const idxBuf = Buffer.alloc(8);
          idxBuf.writeBigUInt64LE(BigInt(i));
          const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("history"), Buffer.from(parcel.parcelId), idxBuf],
            program.programId
          );
          const acc = await (program.account as any).historyEntry.fetch(pda);
          return { ipfsHash: acc.ipfsHash, updatedBy: acc.updatedBy.toString(), timestamp: acc.timestamp.toNumber(), index: i };
        })
      );
      setHistoryEntries(entries.reverse());
    } catch { setHistoryEntries([]); }
  }, [program]);

  useEffect(() => {
    if (selected) fetchHistory(selected);
    else setHistoryEntries([]);
  }, [selected, fetchHistory]);

  const handleLockParcel = async () => {
    if (!program || isReadOnly || !selected) return;
    try {
        setIsPrivilegedActionPending(true);
        const multisigPda = new anchor.web3.PublicKey(selected.registrarAuthority);
        const vaultPda = getVaultPda(multisigPda);
        const ix = await program.methods.lockParcel()
            .accounts({ landAccount: new anchor.web3.PublicKey(selected.pda), multisig: multisigPda, multisigSigner: vaultPda } as any)
            .instruction();
        await executePrivilegedInstruction(multisigPda, ix);
        toast({ title: "🔒 Lock Proposed", description: "Awaiting multisig approval." });
        refreshParcels();
    } catch (err) {
        toast({ title: "Action Failed", description: (err as Error).message, variant: "destructive" });
    } finally { setIsPrivilegedActionPending(false); }
  };

  const handleResolveDispute = async () => {
    if (!program || isReadOnly || !selected) return;
    try {
        setIsPrivilegedActionPending(true);
        const multisigPda = new anchor.web3.PublicKey(selected.registrarAuthority);
        const vaultPda = getVaultPda(multisigPda);
        const ix = await program.methods.resolveDispute()
            .accounts({ landAccount: new anchor.web3.PublicKey(selected.pda), multisig: multisigPda, multisigSigner: vaultPda } as any)
            .instruction();
        await executePrivilegedInstruction(multisigPda, ix);
        toast({ title: "✅ Resolution Proposed", description: "Awaiting multisig approval." });
        refreshParcels();
    } catch (err) {
        toast({ title: "Action Failed", description: (err as Error).message, variant: "destructive" });
    } finally { setIsPrivilegedActionPending(false); }
  };

  const handleRaiseDispute = async (parcelId: string) => {
    if (!program || !publicKey || !selected) return;
    try {
      setIsRaisingDispute(true);
      const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("land"), Buffer.from(parcelId)], program.programId);
      const sig = await program.methods.raiseDispute().accounts({ landAccount: landAccountPda, signer: publicKey } as any).rpc();
      toast({
        title: "⚠️ Dispute Raised",
        description: (<a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline text-primary">View on Explorer →</a>) as any,
      });
      setIsDisputeModalOpen(false);
      setTimeout(() => refreshParcels(), 3000);
    } catch (err) {
      toast({ title: "Dispute Failed", description: (err as Error).message, variant: "destructive" });
    } finally { setIsRaisingDispute(false); }
  };

  const handleTransferPartial = async () => {
    if (!program || !publicKey || !selected) return;
    try {
      setIsTransferring(true);
      const recipientPubkey = new anchor.web3.PublicKey(newOwnerAddress);
      const sharesBps = Math.round(transferPercentage * 100);
      const sig = await program.methods.transferPartial(recipientPubkey, sharesBps).accounts({ landAccount: new anchor.web3.PublicKey(selected.pda), signer: publicKey } as any).rpc();
      toast({
        title: "✅ Stake Transferred",
        description: (<a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline text-primary">View on Explorer →</a>) as any,
      });
      setNewOwnerAddress("");
      setTimeout(() => refreshParcels(), 3000);
    } catch (err) {
      toast({ title: "Transfer Failed", description: (err as Error).message, variant: "destructive" });
    } finally { setIsTransferring(false); }
  };

  const handleUpdateDocument = async () => {
    if (!program || !publicKey || !selected || !updateDocFile) return;
    try {
      setIsUpdatingDoc(true);
      const cid = hasPinataCredentials() ? await uploadToPinata(updateDocFile, `${selected.parcelId}-doc`) : `QmTest${Date.now().toString(36).toUpperCase()}`;
      const [landPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("land"), Buffer.from(selected.parcelId)], program.programId);
      const idxBuf = Buffer.alloc(8);
      idxBuf.writeBigUInt64LE(BigInt(selected.historyCount));
      const [historyPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("history"), Buffer.from(selected.parcelId), idxBuf], program.programId);
      const sig = await program.methods.updateDocument(cid).accounts({
        landAccount: landPda, historyEntry: historyPda, signer: publicKey, verifier: publicKey, systemProgram: anchor.web3.SystemProgram.programId,
      } as any).rpc();
      toast({ title: "✅ Document Updated", description: (<a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline text-primary">View on Explorer →</a>) as any });
      setIsUpdateDocOpen(false); setUpdateDocFile(null);
      setTimeout(() => refreshParcels(), 3000);
    } catch (err) {
      toast({ title: "Update Failed", description: (err as Error).message, variant: "destructive" });
    } finally { setIsUpdatingDoc(false); }
  };

  const addCoOwner = () => setCoOwners([...coOwners, { address: "", share: 1 }]);
  const removeCoOwner = (index: number) => setCoOwners(coOwners.filter((_, i) => i !== index));
  const updateCoOwner = (index: number, field: "address" | "share", value: string | number) => {
    const newCoOwners = [...coOwners];
    if (field === "address") newCoOwners[index].address = value as string;
    if (field === "share") newCoOwners[index].share = value as number;
    setCoOwners(newCoOwners);
  };

  const filtered = ownedParcels.filter((p) => {
    const matchSearch = p.parcelId.toLowerCase().includes(search.toLowerCase()) || p.stakeholders.some(s => s.owner.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const currentUserStake = selected?.stakeholders.find(s => s.owner === publicKey?.toString())?.sharesBps || 0;
  const isVerifier = selected?.approvedVerifiers.includes(publicKey?.toString() ?? "");

  return (
    <div className="flex gap-6 min-h-0 relative">
      <div className="flex-1 min-w-0">
        <motion.div {...fadeUp(0)} className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" /> Property Registry
            </h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setTourStep(1)} className="h-8 text-[10px] gap-1 border-white/10">
                    <Zap size={12} /> Start Tour
                </Button>
                <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-2" disabled={isReadOnly}><Plus size={16} /> New Registration</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-background border-border/50 max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Register Land</DialogTitle></DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Parcel ID</Label>
                          <Input placeholder="KE-NBI-0042" value={newParcelId} onChange={(e) => setNewParcelId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Document</Label>
                          <Input type="file" accept="application/pdf,image/*" className="text-[11px]" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocFile(f); setNewIpfsDocument(""); } }} />
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-primary">Registrar Authority</Label>
                        {multisigAddress ? <span className="text-[11px] font-mono text-emerald-400 break-all">{multisigAddress}</span> : (
                            <Button type="button" size="sm" variant="outline" className="h-8 text-xs w-full" onClick={handleCreateMultisig} disabled={isCreatingMultisig}>
                                {isCreatingMultisig ? "Provisioning…" : "Provision Institutional Multisig"}
                            </Button>
                        )}
                    </div>
                    <DialogFooter><Button type="submit" disabled={isRegistering}>{isRegistering ? "Registering..." : "Submit Registry"}</Button></DialogFooter>
                    </form>
                </DialogContent>
                </Dialog>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input placeholder="Search registry..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="liquid-glass rounded-xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border/30 bg-white/[0.02]"><th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Parcel ID</th><th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th><th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">Syncing...</td></tr> : filtered.length === 0 ? <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground italic">No parcels found.</td></tr> : (
                  filtered.map((parcel) => (
                    <tr key={parcel.pda} onClick={() => setSelected(parcel)} className={`border-b border-border/20 hover:bg-white/[0.03] cursor-pointer ${selected?.pda === parcel.pda ? "bg-primary/5" : ""}`}>
                      <td className="px-5 py-3 font-mono text-sm">{parcel.parcelId}</td>
                      <td className="px-5 py-3"><Badge className={cn("text-[9px] uppercase tracking-wider h-5", STATUS_COLORS[parcel.status])}>{parcel.status}</Badge></td>
                      <td className="px-5 py-3 text-right"><button className="text-xs text-primary font-semibold">Audit</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-80 shrink-0 liquid-glass rounded-xl p-5 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-5"><h3 className="text-base font-semibold font-mono">{selected.parcelId}</h3><button onClick={() => setSelected(null)}><X size={13} /></button></div>
            <div className="mb-6"><CapTable stakeholders={selected.stakeholders} /></div>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3"><Label className="text-[10px] uppercase">Documents</Label>{!isReadOnly && selected.status === "Active" && <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => setIsUpdateDocOpen(!isUpdateDocOpen)}><Upload size={9} /> Update Doc</Button>}</div>
                {isUpdateDocOpen && (
                  <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <Input type="file" accept="application/pdf,image/*" className="text-[10px] h-8" onChange={(e) => setUpdateDocFile(e.target.files?.[0] ?? null)} />
                    <Button size="sm" className="w-full h-8 text-[10px]" onClick={handleUpdateDocument} disabled={isUpdatingDoc || !updateDocFile}>{isUpdatingDoc ? "Updating..." : "Submit on-chain"}</Button>
                  </div>
                )}
                <div className="space-y-2">
                    <a href={`https://ipfs.io/ipfs/${selected.ipfsDocument}`} target="_blank" rel="noreferrer" className="p-2 rounded bg-primary/5 border border-primary/20 text-[10px] flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono"><ExternalLink size={10} /><span className="truncate w-28">{selected.ipfsDocument}</span></div>
                        <span className="text-[8px] opacity-60">Current</span>
                    </a>
                </div>
            </div>
            <div className="border-t border-border/30 pt-4 space-y-4">
              {!isReadOnly && currentUserStake > 0 && selected.status === "Active" && (
                <div className="space-y-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <Input placeholder="Recipient" value={newOwnerAddress} onChange={(e) => setNewOwnerAddress(e.target.value)} className="h-8 text-[10px]" />
                  <Slider value={[transferPercentage]} onValueChange={(v) => setTransferPercentage(v[0])} min={1} max={currentUserStake / 100} />
                  <Button size="sm" className="w-full h-8 text-[10px]" onClick={handleTransferPartial} disabled={isTransferring}>Sign Transfer</Button>
                </div>
              )}
              {!isReadOnly && (
                  <div className="grid grid-cols-1 gap-2">
                    {selected.status === "PendingVerification" && isVerifier && <Button size="sm" className="w-full h-8" onClick={handleActivateParcel} disabled={isActivating}>Activate (Verifier)</Button>}
                    {selected.status === "Active" && <Button variant="outline" size="sm" onClick={handleLockParcel} disabled={isPrivilegedActionPending}>Lock Parcel</Button>}
                    {selected.status === "Disputed" && <Button variant="outline" size="sm" onClick={handleResolveDispute} disabled={isPrivilegedActionPending}>Resolve Dispute</Button>}
                    {currentUserStake >= selected.disputeThresholdBps && selected.status === "Active" && <Button variant="outline" size="sm" onClick={() => setIsDisputeModalOpen(true)}>Raise Dispute</Button>}
                  </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tourStep && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-sm w-full liquid-glass border border-primary/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                    <h4 className="text-lg font-bold mb-2">Registry Tour</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">Learn how to manage your land parcels on Solana.</p>
                    <Button size="sm" onClick={() => setTourStep(null)} className="h-8 text-[10px] px-4">Close</Button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background border-border/50">
          <DialogHeader><DialogTitle>Raise Property Dispute</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs text-muted-foreground">Are you sure you want to raise a dispute for this parcel?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDisputeModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => selected && handleRaiseDispute(selected.parcelId)} disabled={isRaisingDispute}>{isRaisingDispute ? "Raising..." : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, truncate = false, valueClass = "" }: { icon: React.ElementType; label: string; value: string; truncate?: boolean; valueClass?: string; }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5"><Icon size={12} className="text-muted-foreground" /></div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
        <p className={cn("text-xs font-medium leading-snug break-all", truncate && "truncate", valueClass)}>{value}</p>
      </div>
    </div>
  );
}
