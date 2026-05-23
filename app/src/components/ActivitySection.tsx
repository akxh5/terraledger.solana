import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { useEffect, useState } from "react";
import { ArrowRightLeft, UserCheck, FileCheck, MapPin } from "lucide-react";
import SectionAmbient from "@/components/SectionAmbient";

const txTypes = [
  { icon: FileCheck, label: "Registration", color: "text-primary" },
  { icon: UserCheck, label: "Verification", color: "text-primary" },
  { icon: ArrowRightLeft, label: "Transfer", color: "text-primary" },
];

const generateTx = (id: number) => {
  const type = txTypes[Math.floor(Math.random() * txTypes.length)];
  const hash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
  const regions = ["Nairobi", "Lagos", "Accra", "Kigali", "Dar es Salaam", "Kampala"];
  return {
    id,
    type,
    hash,
    region: regions[Math.floor(Math.random() * regions.length)],
    time: "Just now",
  };
};

const ActivitySection = () => {
  const [transactions, setTransactions] = useState(() =>
    Array.from({ length: 5 }, (_, i) => generateTx(i))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prev) => {
        const newTx = generateTx(Date.now());
        return [newTx, ...prev.slice(0, 4)];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="activity" className="py-20 md:py-32 px-6 relative">
      <SectionAmbient position="center" />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div {...fadeUp(0)} className="text-center mb-10 md:mb-12">
          <span className="text-primary text-xs md:text-sm font-medium tracking-wider uppercase mb-3 block">
            Explorer
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            On-Chain <span className="font-serif-italic text-gradient-primary">Activity</span>
          </h2>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="liquid-glass scan-sweep relative rounded-2xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-border/50 flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-medium">LIVE</span>
          </div>
          {/* Fixed-height container prevents page-height changes when entries rotate */}
          <div className="relative z-10" style={{ height: 5 * 68 }}>
            <AnimatePresence initial={false}>
              {transactions.map((tx, idx) => {
                const Icon = tx.type.icon;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20, backgroundColor: "hsl(160 100% 45% / 0.12)" }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      y: idx * 68,
                      backgroundColor: "hsl(160 100% 45% / 0)",
                    }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.25 } }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 40,
                      backgroundColor: { duration: 1.5 },
                      opacity: { duration: 0.4 },
                    }}
                    className="absolute left-0 right-0 flex items-center gap-3 md:gap-4 px-4 md:px-6 border-b border-border/30"
                    style={{ height: 68 }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="text-primary" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{tx.type.label}</span>
                        <span className="text-xs text-muted-foreground">• {tx.region}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono truncate block">{tx.hash}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{tx.time}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ActivitySection;
