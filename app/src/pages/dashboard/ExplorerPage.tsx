import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { X, CheckCircle2, ShieldCheck, ExternalLink, MapPin, Users, Calendar, FileText, Globe } from "lucide-react";
import { useParcels, Parcel } from "@/context/ParcelsContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS = {
  Active: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  PendingVerification: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  Locked: "text-destructive bg-destructive/10 border border-destructive/20",
  Disputed: "text-orange-500 bg-orange-500/10 border border-orange-500/20",
};

type FilterStatus = "All" | "Active" | "PendingVerification" | "Disputed" | "Locked";

export default function ExplorerPage() {
  const { parcels, isLoading } = useParcels();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [selected, setSelected] = useState<Parcel | null>(null);

  const filtered = parcels.filter((p) => statusFilter === "All" || p.status === statusFilter);

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <motion.div {...fadeUp(0)} className="relative liquid-glass rounded-2xl p-6 overflow-hidden border border-white/5">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none opacity-50"
          style={{
            background: "radial-gradient(circle at center, hsl(160 100% 45% / 0.16), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                Live · Public Ledger
              </span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] h-5 uppercase tracking-widest px-2">
                Devnet
              </Badge>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              On-Chain <span className="font-serif-italic text-primary">Explorer</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-lg">
              Real-time view of the decentralized land registry. Verify parcel ownership and history on-chain.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              { label: "Registry Size", value: parcels.length },
              { label: "Active", value: parcels.filter(p => p.status === "Active").length },
              { label: "Network", value: "Solana" },
            ].map((m) => (
              <div key={m.label} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.label}</p>
                <p className="text-xs font-bold tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="relative flex items-center gap-1 liquid-glass rounded-lg p-1 w-fit mt-5 overflow-x-auto max-w-full">
          {(["All", "Active", "PendingVerification", "Disputed", "Locked"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all whitespace-nowrap",
                statusFilter === s
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(160_100%_45%/0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activity Table */}
      <motion.div {...fadeUp(0.05)} className="liquid-glass rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-white/[0.02]">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Parcel ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Owners</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-5 py-4"><Skeleton className="h-4 w-32 bg-white/5" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24 bg-white/5 rounded-full" /></td>
                      <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-16 bg-white/5" /></td>
                      <td className="px-5 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto bg-white/5" /></td>
                    </tr>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground italic">
                    No parcels found in the registry.
                  </td>
                </tr>
              ) : (
                filtered.map((parcel, i) => {
                  return (
                    <motion.tr
                      key={parcel.pda}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.02 * i }}
                      onClick={() => setSelected(parcel)}
                      className={cn(
                        "border-b border-border/20 hover:bg-white/[0.03] transition-colors cursor-pointer group",
                        i % 2 === 1 ? "bg-white/[0.01]" : ""
                      )}
                    >
                      <td className="px-5 py-4 font-mono text-base font-bold text-primary/90">{parcel.parcelId}</td>
                      <td className="px-5 py-4">
                        <Badge className={cn("text-[9px] uppercase tracking-wider h-5", STATUS_COLORS[parcel.status])}>
                          {parcel.status.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-primary/60" />
                          {parcel.stakeholders.length}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground text-right tabular-nums">
                        {parcel.registeredAt}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Parcel Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg liquid-glass rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge variant="outline" className="mb-2 text-[9px] uppercase tracking-[0.2em] border-primary/30 text-primary">
                    Parcel Registry Entry
                  </Badge>
                  <h3 className="text-xl font-bold font-mono text-foreground">{selected.parcelId}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ModalRow label="On-Chain Status" content={
                    <Badge className={cn("text-[10px] uppercase tracking-wider", STATUS_COLORS[selected.status])}>
                      {selected.status}
                    </Badge>
                  } />
                  <ModalRow label="Registration Date" content={
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar size={13} className="text-primary/60" />
                      {selected.registeredAt}
                    </div>
                  } />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe size={11} className="text-primary/60" /> Solana Address (PDA)
                    </p>
                    <p className="text-xs font-mono break-all bg-black/20 p-2 rounded-lg border border-white/5">
                      {selected.pda}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Users size={11} className="text-primary/60" /> Ownership Structure
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {selected.stakeholders.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] bg-black/20 px-3 py-2 rounded-md">
                          <span className="font-mono text-muted-foreground">{s.owner.slice(0, 10)}...{s.owner.slice(-8)}</span>
                          <span className="font-bold text-primary">{(s.sharesBps / 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://solscan.io/account/${selected.pda}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    <ExternalLink size={14} />
                    View on Solscan
                  </a>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${selected.ipfsDocument}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                  >
                    <FileText size={14} />
                    View Documents
                  </a>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[9px] text-muted-foreground italic">
                  Registry data is immutable and cryptographically secured by the Solana network.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalRow({
  label,
  content,
}: {
  label: string;
  content: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      {content}
    </div>
  );
}

