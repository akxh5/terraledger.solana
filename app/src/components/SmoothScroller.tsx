/**
 * SmoothScroller — butter-smooth inertia scrolling via Framer Motion.
 *
 * Strategy:
 *  • A full-viewport fixed wrapper holds the real content.
 *  • A spacer div of the same natural height gives the browser its scroll track.
 *  • On every native scroll event we read window.scrollY and spring-interpolate
 *    a CSS translateY on the content layer — giving a silky, momentum feel.
 *  • Respects prefers-reduced-motion: falls back to a plain <div>.
 */

import { useRef, useLayoutEffect, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface SmoothScrollerProps {
  children: ReactNode;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function SmoothScroller({ children }: SmoothScrollerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  /* ── detect touch devices (skip smoothing — native momentum is better) ── */
  useLayoutEffect(() => {
    setIsTouch(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  const disabled = reducedMotion || isTouch;

  /* ── motion value + spring ────────────────────────────────────────────── */
  const rawY = useMotionValue(0);
  // stiffness / damping tuned for a "buttery" feel without over-shoot
  const springY = useSpring(rawY, { stiffness: 120, damping: 30, mass: 0.8 });

  /* ── measure content height ───────────────────────────────────────────── */
  useLayoutEffect(() => {
    if (disabled) return;

    const el = contentRef.current;
    if (!el) return;

    // Measure immediately to avoid initial 0-height flash
    setPageHeight(el.getBoundingClientRect().height);

    const ro = new ResizeObserver(() => {
      setPageHeight(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [disabled]);

  /* ── sync native scroll → motion value ───────────────────────────────── */
  useLayoutEffect(() => {
    if (disabled) return;

    const onScroll = () => {
      rawY.set(-window.scrollY);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rawY, disabled]);

  /* ── reduced-motion / touch fallback ─────────────────────────────────── */
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Spacer gives the browser its natural scroll track */}
      <div style={{ height: pageHeight, pointerEvents: "none" }} aria-hidden="true" />

      {/* Fixed viewport — content floats here, spring-driven */}
      <motion.div
        ref={contentRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          translateY: springY,
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

export default SmoothScroller;
