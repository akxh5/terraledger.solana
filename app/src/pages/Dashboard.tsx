import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, hoverGlow } from "@/lib/animations";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  MapPin,
  FileCheck,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Globe,
  Bell,
  Search,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  Lock,
  ChevronRight,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import CountUp from "@/components/CountUp";
import Sparkline from "@/components/Sparkline";
import ParcelsPage from "./dashboard/ParcelsPage";
import ExplorerPage from "./dashboard/ExplorerPage";
import DocsPage from "./dashboard/DocsPage";
import { ConnectedWallet } from "@/components/ConnectedWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useTerraledger } from "@/hooks/useTerraledger";
import { useRoles } from "@/hooks/useRoles";
import { useParcels } from "@/context/ParcelsContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Tab = "overview" | "parcels" | "explorer" | "docs";

const navItems: { label: string; tab: Tab; icon: React.ElementType }[] = [
  { label: "Overview", tab: "overview", icon: LayoutDashboard },
  { label: "My Parcels", tab: "parcels", icon: MapPin },
  { label: "Explorer", tab: "explorer", icon: FileCheck },
  { label: "Docs", tab: "docs", icon: Globe },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { connected, publicKey } = useWallet();
  const { openModal } = useWalletModal();
  const { roles, ownedParcels, isLoading: rolesLoading } = useRoles();
  const { parcels, isLoading: parcelsLoading } = useParcels();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [aadhaarHash, setAadhaarHash] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      setAadhaarHash(localStorage.getItem(`aadhaar_hash_${publicKey.toString()}`));
    } else {
      setAadhaarHash(null);
    }
  }, [publicKey]);

  const handleLinkAadhaar = async () => {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      toast({ title: "Invalid Aadhaar", description: "Please enter exactly 12 digits.", variant: "destructive" });
      return;
    }

    setIsLinking(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(aadhaarNumber);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (publicKey) {
        localStorage.setItem(`aadhaar_hash_${publicKey.toString()}`, hashHex);
        setAadhaarHash(hashHex);
        toast({ title: "Identity Linked", description: "Aadhaar hash stored securely (Demo Mode)." });
        setIsAadhaarModalOpen(false);
      }
    } catch (err) {
      toast({ title: "Linking failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const stats = [
    { label: "Your Parcels", value: String(ownedParcels.length), change: "+100%", up: true, icon: MapPin },
    { label: "Verified Records", value: String(ownedParcels.filter(p => p.status === "Active").length), change: "+100%", up: true, icon: FileCheck },
    { label: "Pending Actions", value: String(ownedParcels.filter(p => p.status === "PendingVerification" || p.status === "Disputed").length), change: "Live", up: true, icon: Users },
    { label: "Global Registry", value: String(parcels.length), change: "Live", up: true, icon: Globe },
  ];

  const recentActivities = useMemo(() => {
    return ownedParcels
      .slice()
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
      .slice(0, 5)
      .map(acc => {
        const primary = [...acc.stakeholders].sort((a,b) => b.sharesBps - a.sharesBps)[0];
        const ownerAddr = primary ? primary.owner : "Unknown";
        return {
          type: acc.status === "PendingVerification" ? "Registration" : "Transfer",
          parcel: acc.parcelId,
          from: "On-Chain",
          to: ownerAddr.slice(0, 6) + "..." + ownerAddr.slice(-4),
          time: acc.registeredAt,
          status: acc.status,
        };
      });
  }, [ownedParcels]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Role Switcher */}
      {connected && roles.length > 1 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 p-1.5 rounded-2xl liquid-glass border border-white/10 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold px-2 mb-1">Switch Portal</p>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => navigate(r === 'owner' ? '/dashboard' : `/${r}`)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                (r === 'owner' && activeTab !== 'overview') || (r === 'owner' && activeTab === 'overview') ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {r === 'verifier' && <ShieldCheck size={12} />}
              {r === 'authority' && <Gavel size={12} />}
              {r === 'owner' && <Users size={12} />}
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 relative">
              <img src={logo} alt="TerraLedger" className="w-7 h-7" />
              <span className="font-display text-xl font-bold opacity-90">TerraLedger</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 liquid-glass rounded-full p-1">
              {navItems.map((item) => (
                <button
                  key={item.tab}
                  id={`dash-nav-${item.tab}`}
                  onClick={() => setActiveTab(item.tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    activeTab === item.tab ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(160_100%_45%/0.3)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <div className="flex items-center gap-2">
                <ConnectedWallet />
              </div>
            ) : (
              <Button onClick={openModal} className="h-8 text-xs">Connect Wallet</Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === "overview" && (
          <>
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <motion.div {...fadeUp(0)} className="lg:col-span-2 relative liquid-glass rounded-2xl p-6 md:p-8 overflow-hidden border border-white/5">
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1.5">
                  Welcome back, <span className="font-serif-italic text-primary">Owner</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl">Manage your land parcels and monitor status.</p>
                <Button size="sm" onClick={() => setActiveTab("parcels")} className="mt-4 gap-1.5 h-9"><MapPin size={13} /> Register Parcel</Button>
              </motion.div>

              <motion.div {...fadeUp(0.1)} className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><Fingerprint size={16} className="text-primary" /> Identity</h3>
                <div className="space-y-4 flex-1">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Connected Wallet</p>
                    <p className="text-xs font-mono font-bold truncate">{publicKey?.toString() || "Not connected"}</p>
                  </div>
                  {aadhaarHash ? (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-400 uppercase tracking-widest mb-1 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Aadhaar Verified</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{aadhaarHash}</p>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full h-12 gap-2 font-bold text-xs" onClick={() => setIsAadhaarModalOpen(true)} disabled={!connected}>
                      <Fingerprint size={16} /> Link Aadhaar Identity
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} {...fadeUp(0.15 + 0.05 * i)} className="liquid-glass rounded-xl p-5 border border-white/5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><stat.icon className="text-primary" size={17} /></div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">{parcelsLoading ? "..." : <CountUp value={stat.value} />}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === "parcels" && <ParcelsPage />}
        {activeTab === "explorer" && <ExplorerPage />}
        {activeTab === "docs" && <DocsPage />}
      </main>

      <Dialog open={isAadhaarModalOpen} onOpenChange={setIsAadhaarModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background border-border/50">
          <DialogHeader><DialogTitle>Link Aadhaar Identity</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-muted-foreground">12-Digit Aadhaar Number</Label>
              <Input placeholder="0000 0000 0000" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))} className="text-lg tracking-[0.5em] font-mono h-12 text-center" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAadhaarModalOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkAadhaar} disabled={isLinking || aadhaarNumber.length < 12}>{isLinking ? <Loader2 className="animate-spin mr-2" size={14} /> : null} Link Hash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
