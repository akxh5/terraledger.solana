import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { ChevronRight, BookOpen, FileText, Shield, ArrowRightLeft, Sparkles } from "lucide-react";

const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Overview</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          TerraLedger is a land registry protocol built on Solana. It replaces paper-based or siloed government
          registries with an open, on-chain record of land ownership, verifications, and transfers.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every parcel is represented as a program account on Solana. The record is public, tamper-proof, and
          auditable by anyone — without relying on a central authority.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: "Immutable records", desc: "Once verified, a parcel record cannot be altered without a new on-chain transaction." },
            { label: "Public auditability", desc: "Every registration, verification, and transfer is readable by anyone on-chain." },
            { label: "Multi-party trust", desc: "Transfers require explicit confirmation from both current and incoming owner." },
          ].map((item) => (
            <div key={item.label} className="liquid-glass rounded-xl p-4">
              <p className="text-xs font-semibold mb-1.5">{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "how-it-works",
    label: "How It Works",
    icon: FileText,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">How It Works</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The protocol follows a four-step lifecycle for every land parcel.
        </p>
        <div className="space-y-3">
          {[
            {
              step: "01",
              title: "Register parcel",
              desc: "The parcel owner submits a registration transaction containing geographic identifiers and metadata. This creates an on-chain account for the parcel.",
            },
            {
              step: "02",
              title: "Upload documents",
              desc: "Supporting documents (surveys, deeds, photos) are uploaded to IPFS. The resulting content hash is stored in the parcel account — files are stored off-chain, the proof is on-chain.",
            },
            {
              step: "03",
              title: "Verifier signs",
              desc: "An authorised verifier — a licensed surveyor, government agency, or DAO — inspects the submission and signs the parcel account. This marks it as Verified.",
            },
            {
              step: "04",
              title: "Ownership recorded",
              desc: "Once verified, the owner's wallet address is the canonical owner of the parcel. Any future transfer updates this field and creates an auditable history.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 liquid-glass rounded-xl p-4">
              <span className="text-2xl font-bold text-primary/30 tabular-nums leading-none shrink-0">{item.step}</span>
              <div>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "verification-model",
    label: "Verification Model",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Verification Model</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A verifier is any address granted signing authority by the protocol's governance. They are responsible for
          confirming that a parcel's physical details match the on-chain claim.
        </p>
        <div className="space-y-3">
          {[
            {
              title: "Who can verify?",
              desc: "Licensed surveyors, government land registries, or approved DAOs. The list is maintained on-chain and updated through governance.",
            },
            {
              title: "What does verification mean?",
              desc: "The verifier attests that the submitted documents are valid, the coordinates are accurate, and no conflicting claim exists.",
            },
            {
              title: "What if a verifier is compromised?",
              desc: "Governance can revoke a verifier's authority. Past verifications remain on-chain and auditable, but a re-verification can be requested.",
            },
            {
              title: "Pending vs Verified",
              desc: "Pending parcels are registered but not yet signed by a verifier. They are visible publicly, but carry no official guarantee.",
            },
          ].map((item) => (
            <div key={item.title} className="liquid-glass rounded-xl p-4">
              <p className="text-xs font-semibold mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "transfers",
    label: "Transfers",
    icon: ArrowRightLeft,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Transfers</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Transferring ownership requires both parties to sign. This prevents one-sided malicious transfers.
        </p>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Initiate",
              desc: "Current owner calls the transfer instruction, specifying the recipient wallet and any attached conditions.",
            },
            {
              step: "2",
              title: "Confirm",
              desc: "The receiving wallet must sign a confirmation transaction within a specified window. Unsigned transfers expire and revert.",
            },
            {
              step: "3",
              title: "Record",
              desc: "Once both signatures are captured on-chain, the parcel account's owner field is updated and the transfer is appended to the audit log.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 liquid-glass rounded-xl p-4">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="liquid-glass rounded-xl p-4 border border-yellow-400/10">
          <p className="text-xs font-semibold text-yellow-400 mb-1">Note on partial transfers</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Partial ownership (fractional shares) is not supported in the current protocol version. Each parcel has
            exactly one owner address at any time.
          </p>
        </div>
      </div>
    ),
  },
];

export default function DocsPage() {
  const [active, setActive] = useState("overview");
  const activeSection = sections.find((s) => s.id === active)!;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div {...fadeUp(0)} className="relative liquid-glass rounded-2xl p-6 md:p-8 overflow-hidden border border-white/5">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-50"
          style={{
            background: "radial-gradient(circle at center, hsl(160 100% 45% / 0.16), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <Sparkles size={10} /> Protocol Documentation
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              Understand the <span className="font-serif-italic text-primary">TerraLedger</span> protocol
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
              How parcels move on-chain — from registration through verification to ownership transfer.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Sections</p>
              <p className="text-sm font-bold tabular-nums">{sections.length}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Version</p>
              <p className="text-sm font-bold tabular-nums">v1.0</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6 min-h-0">
        {/* Sidebar */}
        <motion.nav {...fadeUp(0.05)} className="md:w-52 shrink-0 space-y-1 self-start md:sticky md:top-24">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2 hidden md:block">Contents</p>
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left whitespace-nowrap ${
                    active === s.id
                      ? "bg-primary/10 text-primary font-medium shadow-[inset_0_0_0_1px_hsl(160_100%_45%/0.25)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon size={13} className="shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] tabular-nums opacity-60">0{i + 1}</span>
                    {active === s.id && <ChevronRight size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>

        {/* Content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 min-w-0 liquid-glass rounded-2xl p-6 md:p-8 border border-white/5"
        >
          {activeSection.content}
        </motion.div>
      </div>
    </div>
  );
}
