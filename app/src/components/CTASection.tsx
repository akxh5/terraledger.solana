import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import AmbientParticles from "@/components/AmbientParticles";

const CTASection = () => {
  return (
    <section id="docs" className="py-20 md:py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vw] md:w-[600px] h-[400px] md:h-[600px] bg-primary/8 rounded-full blur-[120px] md:blur-[200px]" />

      {/* Floating particles */}
      <AmbientParticles count={28} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div {...fadeUp(0)}>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Explore verifiable ownership{" "}
            <span className="font-serif-italic text-gradient-primary">on-chain</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 md:mb-10 max-w-lg mx-auto">
            Interact with TerraLedger and experience a transparent ownership flow from registration to transfer.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="flex justify-center">
          <a
            href="https://medium.com/@aksh11ansh"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-sm font-semibold rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
              style={{ animation: "pulse-halo 3s ease-in-out infinite" }}
            >
              Read The Protocol →
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
