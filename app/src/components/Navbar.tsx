import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Wallet, ShieldCheck, Gavel, LayoutDashboard } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import logo from "@/assets/logo.png";
import { useWalletModal } from "@/hooks/useWalletModal";
import { ConnectedWallet } from "@/components/ConnectedWallet";
import { useRoles } from "@/hooks/useRoles";
import { Badge } from "./ui/badge";

/** Smooth-scroll to an anchor id, offset by the fixed navbar height */
const NAVBAR_HEIGHT = 64;
function smoothScrollTo(href: string) {
  if (href === "#" || !href.startsWith("#")) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const target = document.querySelector(href);
  if (target) {
    const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { connected, connecting } = useWallet();
  const { openModal } = useWalletModal();
  const { roles, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = useMemo(() => {
    const base = [
      { label: "Home", href: "#" },
      { label: "Protocol", href: "#system" },
      { label: "Explorer", href: "#activity" },
    ];
    
    if (connected && !rolesLoading) {
      if (roles.includes('owner')) base.push({ label: "Dashboard", href: "/dashboard" });
      if (roles.includes('verifier')) base.push({ label: "Verifier", href: "/verifier" });
      if (roles.includes('authority')) base.push({ label: "Authority", href: "/authority" });
      
      if (roles.length === 0) {
        base.push({ label: "Register Land", href: "/dashboard" });
      }
    } else {
      base.push({ label: "Docs", href: "#docs" });
    }
    
    return base;
  }, [connected, roles, rolesLoading]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith("/")) return; // let react-router handle
      e.preventDefault();
      if (location.pathname !== "/") {
        navigate("/" + href); // navigate home with hash
        // Defer scroll until after route change + paint
        setTimeout(() => smoothScrollTo(href), 300);
        return;
      }
      smoothScrollTo(href);
    },
    [location.pathname, navigate]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Shared CTA rendering ──────────────────────────────────────────────────
  const renderDesktopCTA = () => {
    if (connected) {
      return (
        <div className="flex items-center gap-3">
          {roles.length > 0 && (
            <div className="flex flex-col items-end mr-1">
               <div className="flex gap-1 mb-0.5">
                  {roles.map(r => (
                    <span key={r} className={`w-1 h-1 rounded-full animate-pulse ${
                      r === 'owner' ? 'bg-emerald-500' : r === 'verifier' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                  ))}
               </div>
               <span className="text-[7px] uppercase tracking-widest text-primary font-bold opacity-70">
                 {roles.join(' · ')}
               </span>
            </div>
          )}
          <ConnectedWallet />
        </div>
      );
    }
    return (
      <>
        {/* Ghost "Login" */}
        <button
          id="navbar-login-btn"
          onClick={openModal}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <span className="opacity-50 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all duration-200">▸</span>
          <span>Login</span>
          <span className="opacity-50 group-hover:opacity-100 group-hover:translate-x-[2px] transition-all duration-200">◂</span>
        </button>

        {/* Pill "Connect Wallet" / "Sign Up" */}
        <button
          id="navbar-connect-btn"
          onClick={openModal}
          disabled={connecting}
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md text-foreground px-4 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold hover:scale-[1.03] hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(0,230,154,0.25)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {connecting ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all duration-200">▸</span>
              <span>Connect Wallet</span>
              <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-[2px] transition-all duration-200">◂</span>
            </>
          )}
        </button>
      </>
    );
  };

  const renderMobileCTA = () => {
    if (connected) {
      return (
        <div className="mt-2 px-1 flex items-center justify-between">
          <ConnectedWallet />
          <div className="flex gap-1.5 mr-2">
            {roles.map(r => (
              <Badge key={r} variant="outline" className="text-[8px] uppercase px-1.5 py-0 h-4 border-primary/30 text-primary">{r}</Badge>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => { openModal(); setMobileOpen(false); }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-foreground border border-border rounded-full"
        >
          <span className="opacity-60">▸</span>
          <span>Login</span>
          <span className="opacity-60">◂</span>
        </button>
        <button
          onClick={() => { openModal(); setMobileOpen(false); }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] font-semibold"
        >
          <Wallet size={13} />
          <span>Connect</span>
        </button>
      </div>
    );
  };

  return (
    <motion.nav
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/60 border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="TerraLedger" className="w-8 h-8 object-contain" />
            <span className="tracking-tight font-display text-xl text-left font-bold opacity-90 rounded-none border-0">TerraLedger</span>
          </Link>

          {/* Center pill nav (desktop) */}
          <div
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center rounded-full px-1.5 py-1.5 border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {navLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onMouseEnter={() => setHoveredIdx(i)}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full"
              >
                {hoveredIdx === i && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 bg-white/[0.06] rounded-full border border-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {link.href === '/dashboard' && <LayoutDashboard size={10} />}
                  {link.href === '/verifier' && <ShieldCheck size={10} />}
                  {link.href === '/authority' && <Gavel size={10} />}
                  {link.label}
                </span>
              </a>
            ))}
          </div>

          {/* Right CTAs (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {renderDesktopCTA()}
          </div>

          {/* Tablet: Sign Up + menu toggle */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {connected ? (
              <ConnectedWallet />
            ) : (
              <button
                onClick={openModal}
                disabled={connecting}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md text-foreground px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(0,230,154,0.25)] transition-all duration-200"
              >
                <span className="opacity-70">▸</span>
                <span>Connect</span>
                <span className="opacity-70">◂</span>
              </button>
            )}
            <button
              aria-label="Toggle menu"
              className="text-foreground w-9 h-9 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.3 }}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.div>
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            aria-label="Toggle menu"
            className="md:hidden text-foreground w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.3 }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden border-t border-border/60 backdrop-blur-xl bg-background/90"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 px-3 py-3 rounded-lg transition-colors flex items-center gap-2"
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  setMobileOpen(false);
                }}
              >
                {link.href === '/dashboard' && <LayoutDashboard size={12} />}
                {link.href === '/verifier' && <ShieldCheck size={12} />}
                {link.href === '/authority' && <Gavel size={12} />}
                {link.label}
              </motion.a>
            ))}
            {renderMobileCTA()}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
