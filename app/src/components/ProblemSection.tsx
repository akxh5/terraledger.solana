import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { ShieldAlert, Scale, Building2 } from "lucide-react";
import SectionAmbient from "@/components/SectionAmbient";
import { MouseEvent } from "react";

const problems = [
  {
    icon: ShieldAlert,
    title: "Fragmented Records",
    description: "Ownership data exists across disconnected systems with no unified verification layer.",
  },
  {
    icon: Scale,
    title: "Manual Verification",
    description: "Validating ownership requires time-consuming, trust-dependent processes.",
  },
  {
    icon: Building2,
    title: "Limited Transparency",
    description: "Historical ownership trails are difficult to audit and verify.",
  },
];

const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
};

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-32 px-6 relative">
      <SectionAmbient position="left" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div {...fadeUp(0)} className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ownership without{" "}
            <span className="font-serif-italic text-gradient-primary">clarity</span> is risk.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Land records often rely on fragmented systems, manual verification, and trust-based assumptions.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              {...fadeUp(0.1 * (i + 1))}
              onMouseMove={handleMouseMove}
              className="liquid-glass spotlight-card rounded-2xl p-8 group cursor-default transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <span className="absolute inset-0 rounded-xl border border-primary/30 group-hover:animate-ping" />
                <problem.icon className="text-primary relative z-10" size={22} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
