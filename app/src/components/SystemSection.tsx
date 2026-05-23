import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { Fingerprint, Users, HardDrive, MapPin } from "lucide-react";
import SectionAmbient from "@/components/SectionAmbient";
import { MouseEvent } from "react";

const features = [
  {
    icon: Fingerprint,
    title: "Ownership Layer",
    description: "Structured on-chain records that establish a clear, immutable ownership trail.",
  },
  {
    icon: HardDrive,
    title: "Document Anchoring",
    description: "Off-chain documents secured via IPFS and cryptographically linked to on-chain state.",
  },
  {
    icon: Users,
    title: "Verifier Attestation",
    description: "Independent validation introduces accountability beyond self-claimed ownership.",
  },
  {
    icon: MapPin,
    title: "Transfer Integrity",
    description: "Ownership transitions require multi-party confirmation, reflecting real-world processes.",
  },
];

const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
};

const SystemSection = () => {
  return (
    <section id="system" className="py-20 md:py-32 px-6 relative">
      <SectionAmbient position="right" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div {...fadeUp(0)} className="text-center mb-12 md:mb-16">
          <span className="text-primary text-xs md:text-sm font-medium tracking-wider uppercase mb-3 block">
            The Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Core <span className="font-serif-italic text-gradient-primary">Components</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            A composable infrastructure layer for verifiable ownership.
          </p>
        </motion.div>

        <div className="relative">
          {/* Decorative connecting line on lg+ */}
          <svg
            aria-hidden
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-px hidden lg:block pointer-events-none opacity-30"
            preserveAspectRatio="none"
            viewBox="0 0 100 1"
          >
            <line
              x1="5"
              y1="0.5"
              x2="95"
              y2="0.5"
              stroke="hsl(160 100% 45%)"
              strokeWidth="0.05"
              strokeDasharray="0.5,0.5"
            />
          </svg>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp(0.1 * (i + 1))}
                onMouseMove={handleMouseMove}
                className="liquid-glass spotlight-card rounded-2xl p-6 group cursor-default transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="text-primary" size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemSection;
