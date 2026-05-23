import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import AnimatedBorder from "@/components/AnimatedBorder";

const SolutionSection = () => {
  return (
    <section className="py-20 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          {...fadeUp(0)}
          className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[400px] flex items-center justify-center"
        >
          {/* Slow rotating conic gradient background */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, hsl(160 100% 45% / 0.12), transparent 25%, hsl(170 90% 55% / 0.08) 50%, transparent 75%, hsl(160 100% 45% / 0.12))",
              animation: "border-spin 30s linear infinite",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/40 to-primary/5" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <motion.div {...fadeUp(0.2)} className="relative z-10 text-center px-4 md:px-6 py-12 md:py-20">
            <AnimatedBorder rounded="rounded-2xl" className="max-w-2xl mx-auto">
              <div className="liquid-glass rounded-2xl px-6 py-8 md:px-16 md:py-14">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  A verifiable{" "}
                  <span className="font-serif-italic text-gradient-primary">ownership</span> primitive
                </h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  TerraLedger introduces a composable layer where ownership is not just recorded—but validated, traceable, and auditable.
                </p>
              </div>
            </AnimatedBorder>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
