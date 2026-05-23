/**
 * ConnectedWallet
 * Shows the shortened wallet address with a dropdown:
 *  - Copy Address
 *  - Disconnect
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, LogOut, Check, ChevronDown } from "lucide-react";

function shorten(pubkey: string, chars = 4) {
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

export function ConnectedWallet() {
  const { publicKey, disconnect, wallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = publicKey?.toBase58() ?? "";
  const short = address ? shorten(address) : "";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [address]);

  const handleDisconnect = useCallback(async () => {
    setOpen(false);
    try { await disconnect(); } catch {}
  }, [disconnect]);

  return (
    <div ref={ref} className="relative">
      <button
        id="wallet-connected-btn"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary hover:border-primary/50 hover:bg-primary/12 transition-all duration-200"
      >
        {/* Wallet logo dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow shrink-0" />
        <span className="font-mono tracking-tight">{short}</span>
        <ChevronDown
          size={11}
          className={`text-primary/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="wallet-dropdown"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-52 liquid-glass rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
          >
            {/* Address display */}
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Connected wallet</p>
              <p className="text-xs font-mono text-foreground truncate">{short}</p>
              {wallet && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{wallet.adapter.name}</p>
              )}
            </div>

            {/* Actions */}
            <div className="p-1.5 space-y-0.5">
              <button
                id="wallet-copy-address"
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-secondary/60 transition-colors"
              >
                {copied
                  ? <Check size={13} className="text-primary shrink-0" />
                  : <Copy size={13} className="text-muted-foreground shrink-0" />}
                {copied ? "Copied!" : "Copy Address"}
              </button>
              <button
                id="wallet-disconnect"
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={13} className="shrink-0" />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
