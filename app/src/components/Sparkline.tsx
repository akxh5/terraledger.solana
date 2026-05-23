import { useMemo } from "react";

interface SparklineProps {
  seed?: number;
  trend?: "up" | "down";
  width?: number;
  height?: number;
}

const Sparkline = ({ seed = 1, trend = "up", width = 64, height = 24 }: SparklineProps) => {
  const points = useMemo(() => {
    // deterministic pseudo-random based on seed
    const rand = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 233280;
      return x - Math.floor(x);
    };
    const count = 12;
    const vals: number[] = [];
    let v = 0.5;
    for (let i = 0; i < count; i++) {
      const drift = trend === "up" ? 0.04 : -0.04;
      v = Math.max(0.05, Math.min(0.95, v + drift + (rand(i) - 0.5) * 0.25));
      vals.push(v);
    }
    return vals
      .map((val, i) => {
        const x = (i / (count - 1)) * width;
        const y = height - val * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [seed, trend, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sparkfill-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(160 100% 45%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(160 100% 45%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="hsl(160 100% 45%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#sparkfill-${seed})`}
      />
    </svg>
  );
};

export default Sparkline;
