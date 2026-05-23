import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { X, ArrowRightLeft, CheckCircle2, PlusCircle, ShieldCheck, ExternalLink } from "lucide-react";

const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Registration: { label: "Registration", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: PlusCircle },
  Verification: { label: "Verification", color: "text-primary bg-primary/10 border-primary/20", icon: ShieldCheck },
  Transfer: { label: "Transfer", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: ArrowRightLeft },
};

const feed = [
  {
    id: "tx-001",
    type: "Transfer",
    parcel: "KE-NBI-0042",
    from: "0x8f2...a3c",
    to: "0x1b7...f9d",
    timestamp: "2025-04-25 08:42:11",
    sig: "4wTZ7mX9...kJp2QR",
    sigFull: "4wTZ7mX9nBv3Rq8sYc1LdH6eUk2FiOl0PaGjKp2QR",
    status: "Confirmed",
    block: "318,204,117",
    accounts: ["0x8f2a3c1b...a3c", "0x1b7f9d2e...f9d", "TerraLedger Program"],
  },
  {
    id: "tx-002",
    type: "Registration",
    parcel: "KE-MSA-0118",
    from: "Gov Registry",
    to: "0xc4e...2b1",
    timestamp: "2025-04-25 08:36:05",
    sig: "9rKL2nPo...mN7xYZ",
    sigFull: "9rKL2nPoQ5vWa8jCb4uMdS0eFi1GhTk3mN7xYZopq",
    status: "Confirmed",
    block: "318,203,891",
    accounts: ["Gov Registry", "0xc4e2b1f0...2b1", "TerraLedger Program"],
  },
  {
    id: "tx-003",
    type: "Verification",
    parcel: "KE-KSM-0067",
    from: "Surveyor DAO",
    to: "Verified",
    timestamp: "2025-04-25 08:29:47",
    sig: "2cMn8vRs...wE4bAD",
    sigFull: "2cMn8vRs1tUy9qGzXp7JiKlHf0OdEaBwE4bADcno",
    status: "Confirmed",
    block: "318,203,504",
    accounts: ["Surveyor DAO", "0x3a1d7f...d7f", "TerraLedger Program"],
  },
  {
    id: "tx-004",
    type: "Verification",
    parcel: "KE-NKR-0093",
    from: "0x3a1...d7f",
    to: "Pending",
    timestamp: "2025-04-25 08:12:33",
    sig: "7hJQ3kWp...xS5cUV",
    sigFull: "7hJQ3kWpN1vZm4BrYo6GsEi9TlAf2DcxS5cUVmnb",
    status: "Pending",
    block: "318,202,718",
    accounts: ["0x3a1d7f...d7f", "TerraLedger Program"],
  },
  {
    id: "tx-005",
    type: "Transfer",
    parcel: "KE-NBI-0215",
    from: "0xf9c...4e2",
    to: "0x7d3...a8b",
    timestamp: "2025-04-25 07:55:20",
    sig: "6bPX1gNo...rT8iQK",
    sigFull: "6bPX1gNoM3kHs9WqZd0Cv5EjUy7FaLtBrT8iQKplz",
    status: "Confirmed",
    block: "318,201,933",
    accounts: ["0xf9c4e2...4e2", "0x7d3a8b...a8b", "TerraLedger Program"],
  },
  {
    id: "tx-006",
    type: "Registration",
    parcel: "KE-MBL-0031",
    from: "Land Authority",
    to: "0x2c9...f9d",
    timestamp: "2025-04-25 07:41:08",
    sig: "5eFY2hMq...oU6wXL",
    sigFull: "5eFY2hMqK8sVc3LbWd9Px1Jm0GnIoT4aU6wXLrytv",
    status: "Confirmed",
    block: "318,201,212",
    accounts: ["Land Authority", "0x2c9f1d...f9d", "TerraLedger Program"],
  },
];

type TxItem = (typeof feed)[0];

type FilterType = "All" | "Registration" | "Verification" | "Transfer";

export default function ExplorerPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>("All");
  const [selected, setSelected] = useState<TxItem | null>(null);

  const filtered = feed.filter((tx) => typeFilter === "All" || tx.type === typeFilter);

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
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Live · Solana Devnet
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              On-Chain <span className="font-serif-italic text-primary">Explorer</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-lg">
              Stream of registrations, verifications and ownership transfers settled on TerraLedger.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              { label: "Block", value: "318,204,117" },
              { label: "TPS", value: "2,847" },
              { label: "Avg Fee", value: "0.00021" },
            ].map((m) => (
              <div key={m.label} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.label}</p>
                <p className="text-xs font-bold tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="relative flex items-center gap-1 liquid-glass rounded-lg p-1 w-fit mt-5">
          {(["All", "Registration", "Verification", "Transfer"] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(160_100%_45%/0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activity Table */}
      <motion.div {...fadeUp(0.05)} className="liquid-glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Parcel ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">From</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">To</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}
              {filtered.map((tx, i) => {
                const meta = TYPE_META[tx.type];
                const Icon = meta.icon;
                return (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setSelected(tx)}
                    className={`border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer group ${
                      i % 2 === 1 ? "bg-secondary/[0.04]" : ""
                    }`}
                  >
                    <td className="px-5 py-3 relative">
                      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border ${meta.color}`}>
                        <Icon size={11} />
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono font-medium">{tx.parcel}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono hidden sm:table-cell">{tx.from}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono hidden md:table-cell">{tx.to}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground text-right tabular-nums">{tx.timestamp}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md liquid-glass rounded-2xl p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Transaction Detail</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border ${TYPE_META[selected.type].color}`}>
                      {selected.type}
                    </span>
                    <span className={`text-xs font-medium ${selected.status === "Confirmed" ? "text-primary" : "text-yellow-400"} flex items-center gap-1`}>
                      {selected.status === "Confirmed"
                        ? <CheckCircle2 size={12} />
                        : <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />}
                      {selected.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X size={13} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <ModalRow label="Tx Signature" value={selected.sigFull} mono truncate />
                <ModalRow label="Parcel ID" value={selected.parcel} mono />
                <ModalRow label="Block" value={selected.block} mono />
                <ModalRow label="Block Time" value={selected.timestamp} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Accounts Involved</p>
                  <div className="space-y-1.5">
                    {selected.accounts.map((acc, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs font-mono truncate text-muted-foreground">{acc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/30">
                <a
                  href="#"
                  className="flex items-center justify-center gap-1.5 w-full h-9 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink size={13} />
                  View on Solana Explorer
                </a>
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
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xs font-medium ${mono ? "font-mono" : ""} ${truncate ? "truncate" : "break-all"}`}>{value}</p>
    </div>
  );
}
