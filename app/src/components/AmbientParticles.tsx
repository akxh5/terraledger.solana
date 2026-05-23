import { useMemo } from "react";

interface AmbientParticlesProps {
  count?: number;
}

const AmbientParticles = ({ count = 30 }: AmbientParticlesProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const size = 1 + Math.random() * 2.5;
        const delay = Math.random() * 8;
        const duration = 8 + Math.random() * 10;
        const opacity = 0.3 + Math.random() * 0.5;
        return { i, left, size, delay, duration, opacity };
      }),
    [count]
  );

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.i}
          className="absolute bottom-0 rounded-full bg-primary"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px hsl(160 100% 45% / 0.6)`,
            animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default AmbientParticles;
