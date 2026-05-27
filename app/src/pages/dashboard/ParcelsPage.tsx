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
  Map as MapIcon,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import ParcelMap, { ParcelDrawData } from "@/components/ParcelMap";
import ParcelInfoCard from "@/components/ParcelInfoCard";
import ParcelMapViewer from "@/components/ParcelMapViewer";

const STATUS_COLORS = {
  Active: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  PendingVerification: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  Locked: "text-destructive bg-destructive/10 border border-destructive/20",
  Disputed: "text-orange-500 bg-orange-500/10 border border-orange-500/20",
};

import { useDemoMode } from "@/components/DemoMode";

export default function ParcelsPage() {
  const isDemo = useDemoMode();
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
  const [registrationStep, setRegistrationStep] = useState(1);
  const [parcelDrawData, setParcelDrawData] = useState<ParcelDrawData | null>(null);
  const [isManualId, setIsManualId] = useState(false);
  const [locationDescription, setLocationDescription] = useState("");
  const [geoJsonCid, setGeoJsonCid] = useState("");

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

  const currentUserStake = useMemo(() => {
    if (!selected || !publicKey) return 0;
    return selected.stakeholders.find(s => s.owner === publicKey.toString())?.sharesBps ?? 0;
  }, [selected, publicKey]);

  const isVerifier = roles.includes('verifier');

  // Demo pre-fill
  useEffect(() => {
    if (isDemo && isRegisterModalOpen && !newParcelId) {
      setNewParcelId(`TL-${(Math.random() * 10).toFixed(6)}-${(Math.random() * 10).toFixed(6)}`);
      setNewIpfsDocument("QmDemoHashPreFilledForRecording");
      setIsManualId(true);
    }
  }, [isDemo, isRegisterModalOpen, newParcelId]);

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

  // Metadata fetching
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!selected) {
        setSelectedMetadata(null);
        return;
      }
      
      setIsLoadingMetadata(true);
      try {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${selected.ipfsDocument}`);
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
  }, [selected?.pda, selected?.ipfsDocument]);

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
    const effectiveParcelId = isManualId ? newParcelId : parcelDrawData?.parcelId;
    if (!effectiveParcelId || effectiveParcelId.trim() === "") {
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

      // 1. Upload Boundary GeoJSON if available
      let finalGeoJsonCid = geoJsonCid;
      if (parcelDrawData && !finalGeoJsonCid) {
        const geoJsonBlob = new Blob([JSON.stringify(parcelDrawData.geoJson)], { type: 'application/json' });
        const geoJsonFile = new File([geoJsonBlob], `${effectiveParcelId}-boundary.json`, { type: 'application/json' });
        finalGeoJsonCid = await uploadToPinata(geoJsonFile);
        setGeoJsonCid(finalGeoJsonCid);
      }

      // 2. Upload Legal Document
      let docCid = newIpfsDocument;
      if (docFile) {
        setIsUploadingDoc(true);
        try {
          docCid = await uploadToPinata(docFile, effectiveParcelId + '-registration');
        } finally { setIsUploadingDoc(false); }
      }

      // 3. Create and Upload Metadata JSON
      const metadata = {
        documentCid: docCid,
        geoJsonCid: finalGeoJsonCid,
        parcelId: effectiveParcelId,
        locationDescription,
        registeredAt: new Date().toISOString(),
        registeredBy: publicKey.toString(),
        area: parcelDrawData?.area,
        centroid: parcelDrawData?.centroid
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `${effectiveParcelId}-metadata.json`, { type: 'application/json' });
      const metadataCid = await uploadToPinata(metadataFile);
      
      const multisigPda = new anchor.web3.PublicKey(multisigAddress);
      const vaultPda = getVaultPda(multisigPda);
      const [landAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('land'), Buffer.from(effectiveParcelId)],
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
        .registerLand(effectiveParcelId, metadataCid, initialStakeholders, initialVerifiers, disputeThreshold)
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
      setRegistrationStep(1); setParcelDrawData(null); setLocationDescription(''); setGeoJsonCid('');
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

  return (
    <div className="flex gap-6 min-h-0 relative">
      <div className="flex-1 min-w-0">
        <motion.div {...fadeUp(0)} className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" id="property-registry-header">
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
                <DialogContent className="sm:max-w-[600px] bg-background border-border/50 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Register Land</DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center gap-2">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                              registrationStep >= step ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground"
                            )}>
                              {step}
                            </div>
                            <span className={cn(
                              "text-[10px] font-medium uppercase tracking-widest",
                              registrationStep >= step ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {step === 1 ? "Location" : step === 2 ? "Details" : "Register"}
                            </span>
                            {step < 3 && <div className="w-4 h-px bg-border mx-1" />}
                          </div>
                        ))}
                      </div>
                    </DialogHeader>

                    {registrationStep === 1 && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-tight">Step 1: Mark Land Boundary</Label>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Draw the exact boundary of your land on the map below. This will automatically generate a unique Parcel ID based on the centroid.
                          </p>
                          <ParcelMap 
                            onParcelDrawn={setParcelDrawData} 
                            height="350px" 
                            className="mt-2"
                          />
                        </div>
                        
                        {parcelDrawData ? (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <ParcelInfoCard 
                              data={parcelDrawData} 
                              onConfirm={() => setRegistrationStep(2)} 
                            />
                          </motion.div>
                        ) : (
                          <div className="p-8 rounded-lg border border-dashed border-border bg-secondary/20 text-center">
                            <MapPin size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                            <p className="text-xs text-muted-foreground">Waiting for boundary selection...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {registrationStep === 2 && (
                      <form onSubmit={(e) => { e.preventDefault(); setRegistrationStep(3); }} className="space-y-4 py-4">
                        <div className="space-y-4">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex justify-between items-start mb-2">
                              <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Parcel ID</Label>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-[9px] gap-1"
                                onClick={() => setIsManualId(!isManualId)}
                              >
                                {isManualId ? "Use Map ID" : "Edit Manually"}
                              </Button>
                            </div>
                            {isManualId ? (
                              <Input 
                                placeholder="Enter manual Parcel ID..." 
                                value={newParcelId} 
                                onChange={(e) => setNewParcelId(e.target.value)}
                                className="h-8 text-xs font-mono"
                              />
                            ) : (
                              <code className="text-xs font-mono font-bold block">{parcelDrawData?.parcelId}</code>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Location Description</Label>
                              <Input 
                                placeholder="Survey No, Village, etc." 
                                value={locationDescription} 
                                onChange={(e) => setLocationDescription(e.target.value)} 
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Legal Document (PDF/Img)</Label>
                              <Input
                                type="file"
                                accept="application/pdf,image/*"
                                className="text-[11px] h-9"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) { setDocFile(f); setNewIpfsDocument(""); }
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Dispute Threshold (BPS)</Label>
                            <Input 
                              type="number" 
                              min="100" 
                              max="2000" 
                              value={disputeThreshold} 
                              onChange={(e) => setDisputeThreshold(parseInt(e.target.value))} 
                              className="h-9 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">1000 bps = 10% stake required to raise a dispute.</p>
                          </div>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setRegistrationStep(1)}>Back</Button>
                          <Button type="submit">Continue to Registry</Button>
                        </DialogFooter>
                      </form>
                    )}

                    {registrationStep === 3 && (
                      <form onSubmit={handleRegister} className="space-y-6 py-4">
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <Info size={14} className="text-primary" />
                              Final Verification
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                              <div>
                                <p className="text-muted-foreground uppercase text-[9px] font-bold">Parcel ID</p>
                                <p className="font-mono font-bold truncate">{isManualId ? newParcelId : parcelDrawData?.parcelId}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground uppercase text-[9px] font-bold">Area</p>
                                <p className="font-bold">{parcelDrawData?.area.toLocaleString()} m²</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground uppercase text-[9px] font-bold">Documents</p>
                                <p className="font-medium flex items-center gap-1">
                                  <FileText size={10} className="text-primary" />
                                  {docFile?.name || "Manual CID provided"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-primary font-bold">Registrar Authority (Squads Multisig)</Label>
                            {multisigAddress ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                      <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                                      <span className="text-[11px] font-mono text-emerald-400 break-all">{multisigAddress}</span>
                                  </div>
                                  <Badge variant="outline" className="w-fit text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">2-of-3 Threshold</Badge>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[10px] text-muted-foreground leading-snug">A 2-of-3 Squads multisig will be provisioned linking you with the Validator Council and TerraLedger Ops.</p>
                                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-2 w-full border-primary/50 text-primary hover:bg-primary/10" onClick={handleCreateMultisig} disabled={isCreatingMultisig}>
                                        {isCreatingMultisig ? <><Loader2 size={12} className="animate-spin" /> Provisioning…</> : <><ShieldCheck size={12} /> Provision Institutional Multisig</>}
                                    </Button>
                                </>
                            )}
                          </div>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setRegistrationStep(2)} disabled={isRegistering}>Back</Button>
                          <Button type="submit" disabled={isRegistering || !multisigAddress} className="gap-2">
                            {isRegistering ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : <><Plus size={16} /> Submit Registry</>}
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
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
                {isLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-5 py-4"><Skeleton className="h-4 w-32 bg-white/5" /></td>
                        <td className="px-5 py-4"><Skeleton className="h-4 w-24 bg-white/5 rounded-full" /></td>
                        <td className="px-5 py-4 flex justify-end"><Skeleton className="h-8 w-20 bg-white/5 rounded-md" /></td>
                      </tr>
                    ))}
                  </>
                ) : filtered.length === 0 ? <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground italic">No parcels found.</td></tr> : (
                  filtered.map((parcel) => (
                    <tr key={parcel.pda} onClick={() => setSelected(parcel)} className={`border-b border-border/20 hover:bg-white/[0.03] cursor-pointer ${selected?.pda === parcel.pda ? "bg-primary/5" : ""}`}>
                      <td className="px-5 py-3 font-mono text-base font-bold text-primary/90">{parcel.parcelId}</td>
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
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Documents & Map</Label>
                  {!isReadOnly && selected.status === "Active" && (
                    <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 text-primary" onClick={() => setIsUpdateDocOpen(!isUpdateDocOpen)}>
                      <Upload size={9} /> Update Doc
                    </Button>
                  )}
                </div>

                {isUpdateDocOpen && (
                  <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <Input type="file" accept="application/pdf,image/*" className="text-[11px] h-8" onChange={(e) => setUpdateDocFile(e.target.files?.[0] ?? null)} />
                    <Button size="sm" className="w-full h-8 text-[10px]" onClick={handleUpdateDocument} disabled={isUpdatingDoc || !updateDocFile}>{isUpdatingDoc ? "Updating..." : "Submit on-chain"}</Button>
                  </div>
                )}
                
                <div className="space-y-3">
                    {/* Primary Document */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground opacity-60 tracking-tight">Legal Title Deed</p>
                      <a 
                        href={`https://ipfs.io/ipfs/${selectedMetadata?.documentCid || selected.ipfsDocument}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 rounded bg-primary/5 border border-primary/20 text-[10px] flex items-center justify-between hover:bg-primary/10 transition-colors group"
                      >
                          <div className="flex items-center gap-2 font-mono">
                              <ExternalLink size={10} className="text-primary" />
                              <span className="truncate w-28">{selectedMetadata?.documentCid || selected.ipfsDocument}</span>
                          </div>
                          <span className="text-[8px] opacity-60 group-hover:opacity-100 transition-opacity">Open</span>
                      </a>
                    </div>

                    {/* Map Boundary if available */}
                    {selectedMetadata?.geoJsonCid && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground opacity-60 tracking-tight">Geospatial Boundary</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-8 text-[10px] gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10">
                              <MapIcon size={12} /> View Boundary on Map
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] bg-background border-border/50">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                                <MapIcon className="text-primary" size={16} />
                                Boundary Selection: {selected.parcelId}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                              <ParcelMapViewer 
                                geoJsonCid={selectedMetadata.geoJsonCid} 
                                metadata={selectedMetadata}
                                height="400px"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}

                    {!selectedMetadata && !isLoadingMetadata && (
                      <div className="p-3 rounded-lg border border-dashed border-border bg-secondary/10 text-center">
                        <p className="text-[10px] text-muted-foreground italic">No geospatial data attached.</p>
                      </div>
                    )}

                    {isLoadingMetadata && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-primary opacity-40" />
                      </div>
                    )}
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
                    {currentUserStake >= selected.disputeThresholdBps && selected.status === "Active" && <Button variant="outline" size="sm" onClick={() => setIsDisputeModalOpen(true)}>Raise Dispute</Button>}
                    {selected.status === "Disputed" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toast({ 
                          title: "Authority Required", 
                          description: "Dispute resolution requires governance authority approval. Visit the Authority panel to resolve." 
                        })}
                      >
                        Resolve Dispute
                      </Button>
                    )}
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
