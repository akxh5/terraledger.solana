import { motion } from "framer-motion";

interface SectionAmbientProps {
  position?: "left" | "right" | "center";
  intensity?: "low" | "medium";
}

const SectionAmbient = ({ position = "center", intensity = "low" }: SectionAmbientProps) => {
  const positionClass =
    position === "left"
      ? "-left-32 top-1/4"
      : position === "right"
      ? "-right-32 top-1/4"
      : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";

  const opacity = intensity === "low" ? 0.1 : 0.16;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Drifting orb */}
      <motion.div
        className={`absolute ${positionClass} w-[36rem] h-[36rem] rounded-full`}
        style={{
          background: `radial-gradient(circle at center, hsl(160 100% 45% / ${opacity}), transparent 60%)`,
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -40, 60, 0],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Faint masked grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 100% 45% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(160 100% 45% / 0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
};

export default SectionAmbient;
