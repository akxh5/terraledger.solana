"use client";

/**
 * CinematicFooter — TerraLedger
 *
 * Uses IntersectionObserver + GSAP for entrance animations.
 * Fully compatible with the SmoothScroller (fixed+translateY) setup.
 */

import * as React from "react";
import { useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Github, Twitter, MessageCircle, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes tl-breathe {
  0%   { opacity: 0.4;  transform: scale(1); }
  100% { opacity: 0.78; transform: scale(1.18); }
}
@keyframes tl-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes tl-pulse-dot {
  0%, 100% { opacity: 0.65; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.4); }
}

.tl-breathe    { animation: tl-breathe 9s ease-in-out infinite alternate; }
.tl-marquee    { animation: tl-marquee 36s linear infinite; }
.tl-pulse-dot  { animation: tl-pulse-dot 2.2s ease-in-out infinite; }

/* Subtle base lattice */
.tl-grid {
  background-size: 56px 56px;
  background-image:
    linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
}

/* TERRALEDGER wordmark letters — no glow, no transitions */
.tl-wordmark-letter {
  cursor: default;
  display: inline-block;
}

/* Liquid-glass social icon buttons */
.tl-social-btn {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: hsl(var(--muted-foreground));
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}
.tl-social-btn:hover {
  background: rgba(0, 230, 154, 0.10);
  border-color: rgba(0, 230, 154, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 18px rgba(0, 230, 154, 0.20);
  color: #00e69a;
}

/* Aurora blob */
.tl-aurora {
  background: radial-gradient(
    ellipse at 50% 55%,
    hsl(var(--primary) / 0.18) 0%,
    hsl(var(--accent)  / 0.10) 40%,
    transparent 68%
  );
  filter: blur(36px);
}

/* Giant brand watermark */
.tl-wordmark {
  font-family: 'Playfair Display', Georgia, serif;
  /* Sized to always fit on a single line: 11 letters × ~0.6em ≈ 6.6em */
  font-size: clamp(2rem, 13vw, 11rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.82;
  color: transparent;
  -webkit-text-stroke: 1px hsl(var(--foreground) / 0.065);
  background: linear-gradient(175deg,
    hsl(var(--foreground) / 0.10) 0%,
    transparent 55%);
  -webkit-background-clip: text;
  background-clip: text;
  user-select: none;
  white-space: nowrap;
  overflow: visible;
  width: 100%;
  text-align: center;
}
/* Spotlight wrapper — cursor-tracked radial overlay (same mechanic as .spotlight-card) */
.tl-wordmark-wrap {
  position: relative;
  display: block;
}
.tl-wordmark-wrap::after {
  content: '';
  position: absolute;
  inset: -20% -5%;
  background: radial-gradient(
    600px circle at var(--mx, 50%) var(--my, 50%),
    hsl(160 100% 45% / 0.08),
    transparent 40%
  );
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: inherit;
}
.tl-wordmark-wrap:hover::after {
  opacity: 1;
}
/* Keep single clamp across breakpoints to guarantee the full word fits */

/* Metallic heading */
.tl-heading {
  font-family: 'Playfair Display', Georgia, serif;
  line-height: 1.2;
  padding-bottom: 0.1em;
  background: linear-gradient(160deg,
    hsl(var(--foreground)) 0%,
    hsl(var(--foreground) / 0.42) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 16px hsl(var(--primary) / 0.22));
}

/* Glass pill */
.tl-pill {
  background: linear-gradient(145deg,
    hsl(var(--foreground) / 0.05) 0%,
    hsl(var(--foreground) / 0.015) 100%);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow:
    0 6px 20px -6px hsl(var(--background) / 0.5),
    inset 0 1px 1px hsl(var(--foreground) / 0.07);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: hsl(var(--muted-foreground));
}
.tl-pill:hover {
  background: linear-gradient(145deg,
    hsl(var(--primary) / 0.10) 0%,
    hsl(var(--foreground) / 0.03) 100%);
  border-color: hsl(var(--primary) / 0.35);
  color: hsl(var(--foreground));
  box-shadow:
    0 12px 28px -8px hsl(var(--background) / 0.55),
    inset 0 1px 1px hsl(var(--primary) / 0.12);
}
`;

// ─── Magnetic button ──────────────────────────────────────────────────────────
type MagBtnProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
};

const MagBtn = React.forwardRef<HTMLElement, MagBtnProps>(
  ({ className, children, as = "button", ...props }, fwdRef) => {
    const El = as as React.ElementType;
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const ctx = gsap.context(() => {
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          gsap.to(el, {
            x: x * 0.28, y: y * 0.28,
            rotationX: -y * 0.09, rotationY: x * 0.09,
            scale: 1.04, ease: "power2.out", duration: 0.36,
          });
        };
        const onLeave = () =>
          gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1,0.4)", duration: 1.1 });

        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        };
      }, el);
      return () => ctx.revert();
    }, []);

    return (
      <El
        ref={(n: HTMLElement | null) => {
          ref.current = n;
          if (typeof fwdRef === "function") fwdRef(n);
          else if (fwdRef) (fwdRef as React.MutableRefObject<HTMLElement | null>).current = n;
        }}
        className={cn("cursor-pointer inline-block", className)}
        style={{ transformStyle: "preserve-3d" }}
        {...props}
      >
        {children}
      </El>
    );
  }
);
MagBtn.displayName = "MagBtn";

// ─── Marquee ──────────────────────────────────────────────────────────────────
const TICKS = [
  "Verifiable Land Ownership",
  "Document Anchoring",
  "On-Chain State",
  "Sovereign Records",
  "Verifier-Backed Validation",
  "Immutable Titles",
];

const TickRow = () => (
  <div className="flex shrink-0 items-center gap-10 pr-10">
    {TICKS.map((t, i) => (
      <span
        key={i}
        className="whitespace-nowrap text-[11px] sm:text-xs tracking-[0.28em] uppercase text-muted-foreground/50 font-semibold"
      >
        {t} <span className="text-primary/55 ml-8">✦</span>
      </span>
    ))}
  </div>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────
// GitHub pill removed — the GitHub icon in social row covers it
const NAV = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Explorer", to: "/dashboard" },
  { label: "Docs", to: "/dashboard" },
];

// ─── Animate-in helper (IntersectionObserver, no ScrollTrigger) ──────────────
function useRevealOnEnter<T extends HTMLElement>(
  fromVars: gsap.TweenVars,
  toVars: gsap.TweenVars,
  deps: unknown[] = []
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Start hidden
    gsap.set(el, fromVars);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { ...toVars, ease: toVars.ease ?? "power3.out", duration: toVars.duration ?? 0.9 });
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// ─── Proximity glow constants ─────────────────────────────────────────────────
const BRAND_GREEN = "#00e69a";
const MAX_DIST = 180; // glow radius in pixels

// ─── Component ───────────────────────────────────────────────────────────────
export function CinematicFooter() {
  const rootRef = useRef<HTMLElement | null>(null);
  // Refs for each letter span — used by proximity glow handler
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const wordmarkRef = useRevealOnEnter<HTMLDivElement>(
    { y: 48, opacity: 0, scale: 0.92 },
    { y: 0, opacity: 1, scale: 1, duration: 1.1 }
  );
  const headRef = useRevealOnEnter<HTMLDivElement>(
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.85, delay: 0.12 }
  );
  const barRef = useRevealOnEnter<HTMLDivElement>(
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.75, delay: 0.22 }
  );

  // Grid is static — no mouse tracking, no hover effects.

  // Proximity glow: single handler on the wrapper
  const handleWordmarkMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    letterRefs.current.forEach(span => {
      if (!span) return;
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
      const intensity = Math.max(0, 1 - dist / MAX_DIST);
      if (intensity > 0.05) {
        const g = BRAND_GREEN;
        span.style.textShadow = `0 0 ${20 * intensity}px ${g}, 0 0 ${40 * intensity}px ${g}, 0 0 ${70 * intensity}px ${g}`;
        span.style.color = `rgba(255,255,255,${0.3 + 0.7 * intensity})`;
        span.style.webkitTextFillColor = `rgba(255,255,255,${0.3 + 0.7 * intensity})`;
      } else {
        span.style.textShadow = "none";
        span.style.color = "";
        span.style.webkitTextFillColor = "";
      }
    });
  }, []);

  const handleWordmarkMouseLeave = useCallback(() => {
    letterRefs.current.forEach(span => {
      if (!span) return;
      span.style.textShadow = "none";
      span.style.color = "";
      span.style.webkitTextFillColor = "";
    });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <footer
        ref={rootRef}
        className="relative isolate overflow-hidden bg-background border-t border-border/40 pb-8"
      >
        {/* Backgrounds — grid is static, no mouse-tracking */}
        <div aria-hidden className="tl-aurora absolute inset-0 -z-20 pointer-events-none" />
        <div aria-hidden className="tl-grid absolute inset-0 -z-10 pointer-events-none" />

        {/* ── Diagonal marquee ── */}
        <div className="relative -rotate-1 scale-[1.04] overflow-hidden border-y border-border/30 bg-background/50 backdrop-blur-sm py-3 mb-8">
          <div className="flex w-max tl-marquee">
            <TickRow /><TickRow />
          </div>
        </div>

        {/* ── Giant wordmark — proximity glow via single wrapper handler ── */}
        <div
          ref={wordmarkRef as React.RefObject<HTMLDivElement>}
          className="tl-wordmark text-center w-full mb-2"
          onMouseMove={handleWordmarkMouseMove}
          onMouseLeave={handleWordmarkMouseLeave}
        >
          {"TERRALEDGER".split("").map((letter, i) => (
            <span
              key={i}
              className="tl-wordmark-letter"
              ref={el => { letterRefs.current[i] = el; }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* ── Main content ── */}
        <div
          ref={headRef as React.RefObject<HTMLDivElement>}
          className="relative z-10 max-w-2xl mx-auto px-6 text-center pt-4 pb-2"
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full tl-pill text-[10px] sm:text-xs tracking-[0.24em] uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary tl-pulse-dot" />
            Live on Solana Devnet
          </div>

          <h2 className="tl-heading text-2xl sm:text-3xl md:text-[2.25rem] font-black tracking-tight">
            Build on verifiable ground.
          </h2>
        </div>

        {/* ── Bottom bar ── */}
        {/*
         * Desktop:  [Brand] ──────── [Nav pills] ──────── [Social + Top]
         * Tablet:   same row, compressed spacing
         * Mobile:   Row 1 (Brand) / Row 2 (Nav pills) / Row 3 (Social + Top)
         */}
        <div
          ref={barRef as React.RefObject<HTMLDivElement>}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mt-10 pt-5 border-t border-border/25"
        >
          {/* Single-row on sm+, three stacked rows on mobile */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">

            {/* Row 1 / Left: Brand */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="TerraLedger" className="w-5 h-5 opacity-85" />
              <span className="text-sm font-semibold tracking-tight">TerraLedger</span>
              <span className="text-[11px] text-muted-foreground ml-1">© 2026</span>
            </div>

            {/* Row 2 / Centre: Nav pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {NAV.map(({ label, to }) => (
                <MagBtn key={label} as={Link} to={to} className="tl-pill rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] sm:px-3.5">
                  {label}
                </MagBtn>
              ))}
            </div>

            {/* Row 3 / Right: Social buttons + Top */}
            <div className="flex items-center gap-2">
              {([
                { icon: Github, label: "GitHub", href: "#" },
                { icon: Twitter, label: "X", href: "#" },
                { icon: MessageCircle, label: "Discord", href: "#" },
              ] as const).map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="tl-social-btn"
                >
                  <Icon size={14} />
                </a>
              ))}
              <MagBtn
                as="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
                className="tl-pill rounded-full px-4 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 ml-1 min-h-[36px]"
              >
                <ArrowUp size={12} />
                Top
              </MagBtn>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}

export default CinematicFooter;
