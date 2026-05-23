import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { X, Loader2, ExternalLink } from "lucide-react";

// ─── Wallet icons — official SVGs served from /public/wallet-icons/ ───────────
// Phantom & Solflare: extracted from their npm adapter packages (base64 → SVG).
// Backpack & MetaMask: official brand SVGs, locally hosted.
const WALLET_ICONS: Record<string, string> = {
  Phantom:             "/wallet-icons/phantom.svg",
  Solflare:            "/wallet-icons/solflare.svg",
  Backpack:            "/wallet-icons/backpack.svg",
  "MetaMask (Solana)": "/wallet-icons/metamask.svg",
  DevWallet: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDQgMTB2MTJsOC04IDgtOHYxMkwxMiAyemoiLz48L3N2Zz4=",
};

// ─── Wallet manifest ───────────────────────────────────────────────────────────

interface WalletEntry {
  installUrl: string;
  detect?: () => boolean;
}

const WALLET_INFO: Record<string, WalletEntry> = {
  Phantom: {
    installUrl: "https://phantom.app/",
  },
  Solflare: {
    installUrl: "https://solflare.com/",
  },
  Backpack: {
    installUrl: "https://backpack.app/",
  },
  "MetaMask (Solana)": {
    installUrl: "https://snaps.metamask.io/snap/npm/solflare-wallet/solana-snap/",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as { ethereum?: { isMetaMask?: boolean } }).ethereum
        ?.isMetaMask,
  },
  DevWallet: {
    installUrl: "",
  },
};

const WALLET_ORDER = ["Phantom", "Solflare", "Backpack", "MetaMask (Solana)", "DevWallet"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: Props) {
  const { wallets, select, connecting, wallet } = useWallet();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSelect = useCallback(
    (walletName: string) => {
      const adapter = wallets.find((w) => w.adapter.name === walletName);
      const info = WALLET_INFO[walletName];

      // No Solana adapter registered (e.g. MetaMask via Snap) → open install page
      if (!adapter) {
        if (info?.installUrl) window.open(info.installUrl, "_blank", "noopener,noreferrer");
        return;
      }

      // Adapter found but extension not installed → open install page
      if (adapter.readyState === WalletReadyState.NotDetected) {
        if (info?.installUrl) window.open(info.installUrl, "_blank", "noopener,noreferrer");
        return;
      }

      // Select the wallet — triggers adapter context state update.
      // Close AFTER React flushes the selection to avoid WalletNotSelectedError.
      select(adapter.adapter.name);
      requestAnimationFrame(() => onClose());
    },
    [wallets, select, onClose]
  );

  // Build display list — merge adapter registry with WALLET_INFO
  const displayWallets = WALLET_ORDER.map((name) => {
    const adapter = wallets.find((w) => w.adapter.name === name);
    const info = WALLET_INFO[name];
    const installOnly = !adapter;
    const detected = !installOnly && adapter!.readyState !== WalletReadyState.NotDetected;
    return { name, detected, installOnly, info };
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────────── */}
          <motion.div
            key="wallet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/*
           * ── Modal wrapper ────────────────────────────────────────────
           * Full-screen flex container for centering — avoids translate
           * breaking fixed positioning under ancestor CSS transforms
           * (e.g. SmoothScroller's motion.div).
           */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              key="wallet-modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Connect wallet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="liquid-glass rounded-2xl shadow-2xl overflow-hidden border border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                  <div>
                    <h2 className="text-sm font-semibold">Connect Wallet</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Choose your Solana wallet</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    aria-label="Close"
                  >
                    <X size={13} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Connecting banner */}
                {connecting && (
                  <div className="px-6 py-3 flex items-center gap-3 bg-primary/5 border-b border-border/30">
                    <Loader2 size={13} className="text-primary animate-spin shrink-0" />
                    <p className="text-xs text-primary font-medium">
                      Connecting to {wallet?.adapter.name}…
                    </p>
                  </div>
                )}

                {/* Wallet list */}
                <div className="p-3 space-y-1">
                  {displayWallets.map(({ name, detected, installOnly, info }) => {
                    const statusLabel = installOnly
                      ? "Install via MetaMask Snap"
                      : detected
                        ? "Detected"
                        : "Not installed — click to install";
                    const statusClass = installOnly
                      ? "text-primary/70"
                      : detected
                        ? "text-muted-foreground"
                        : "text-yellow-500/80";
                    return (
                      <button
                        key={name}
                        id={`wallet-option-${name.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => handleSelect(name)}
                        disabled={connecting}
                        className={[
                          "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-left",
                          connecting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary/5 hover:shadow-[inset_0_0_0_1px_hsl(160_100%_45%/0.2)] cursor-pointer",
                        ].join(" ")}
                      >
                        {/* Icon — locally served official SVG */}
                        <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white/[0.03]">
                          <img
                            src={WALLET_ICONS[name]}
                            alt={name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-contain rounded-xl"
                          />
                        </div>

                        {/* Name + status */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">{name}</p>
                          <p className={`text-[11px] mt-1 leading-none ${statusClass}`}>
                            {statusLabel}
                          </p>
                        </div>

                        {/* Right indicator */}
                        {detected && !installOnly ? (
                          <span className="text-primary/0 group-hover:text-primary/70 text-xs transition-colors shrink-0 font-mono">→</span>
                        ) : (
                          <ExternalLink size={13} className="text-muted-foreground/40 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-1">
                  <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
                    Your wallet is never accessed without explicit approval.
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
