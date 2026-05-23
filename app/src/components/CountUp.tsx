import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: string; // e.g. "124,891" or "3,291"
  duration?: number;
  className?: string;
}

const CountUp = ({ value, duration = 1200, className }: CountUpProps) => {
  // Parse numeric portion preserving formatting (commas, sign)
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(numeric);
      return;
    }
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(numeric * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [numeric, duration]);

  const formatted =
    numeric % 1 === 0
      ? Math.round(display).toLocaleString()
      : display.toFixed(1);

  return <span className={className}>{formatted}</span>;
};

export default CountUp;
