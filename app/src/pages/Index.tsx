import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRoles, Role } from "@/hooks/useRoles";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SystemSection from "@/components/SystemSection";
import ActivitySection from "@/components/ActivitySection";
import SolutionSection from "@/components/SolutionSection";
import CTASection from "@/components/CTASection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { SmoothScroller } from "@/components/SmoothScroller";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, Gavel, ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletModal } from "@/hooks/useWalletModal";

const Index = () => {
  const { connected } = useWallet();
  const { openModal } = useWalletModal();
  const { roles, isLoading, isOwner, isVerifier, isAuthority } = useRoles();
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isEnteringApp, setIsEnteringApp] = useState(false);

  const handleOpenDashboard = useCallback(() => {
    if (!connected) {
      openModal();
      return;
    }
    setIsEnteringApp(true);
  }, [connected, openModal]);

  useEffect(() => {
    if (connected && isEnteringApp && !isLoading) {
      if (roles.length > 1) {
        setShowRoleSelection(true);
      } else if (roles.length === 1) {
        const target = roles[0] === 'owner' ? '/dashboard' : `/${roles[0]}`;
        navigate(target);
      } else {
        // No roles -> redirect to dashboard (empty state)
        navigate('/dashboard');
      }
    }
  }, [connected, isEnteringApp, isLoading, roles, navigate]);

  const roleCards = [
    {
      id: 'owner' as Role,
      title: "Land Owner",
      description: "Manage your land parcels, transfer ownership, and track history.",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      path: "/dashboard",
      show: isOwner
    },
    {
      id: 'verifier' as Role,
      title: "Official Verifier",
      description: "Review and activate pending parcels assigned to you.",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      path: "/verifier",
      show: isVerifier
    },
    {
      id: 'authority' as Role,
      title: "Governance Authority",
      description: "Governance — resolve disputes, manage verifiers, and lock parcels.",
      icon: Gavel,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
      path: "/authority",
      show: isAuthority
    }
  ];

  return (
    <SmoothScroller>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <AnimatePresence>
          {connected && isEnteringApp && isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
            >
              <Loader2 className="animate-spin text-primary mb-4" size={40} />
              <h2 className="text-xl font-bold mb-2">Checking your access...</h2>
              <p className="text-muted-foreground">Deriving roles from on-chain state</p>
            </motion.div>
          )}

          {showRoleSelection && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
            >
              <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Select Your Portal</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Your wallet holds multiple roles in the TerraLedger ecosystem. 
                    Choose which portal you'd like to enter.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {roleCards.filter(c => c.show).map((card, idx) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                      onClick={() => navigate(card.path)}
                      className={`cursor-pointer p-6 rounded-2xl border ${card.border} ${card.bg} flex flex-col items-center text-center transition-all hover:shadow-[0_0_40px_rgba(0,230,154,0.1)]`}
                    >
                      <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center mb-6`}>
                        <card.icon className={card.color} size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                        {card.description}
                      </p>
                      <Button 
                        variant="outline" 
                        className={`w-full gap-2 ${card.border} hover:${card.bg}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(card.path);
                        }}
                      >
                        Enter Portal <ArrowRight size={16} />
                      </Button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-12 text-center">
                  <Button variant="ghost" onClick={() => {
                    setShowRoleSelection(false);
                    setIsEnteringApp(false);
                  }}>
                    View Landing Page
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <HeroSection onOpenDashboard={handleOpenDashboard} />
        <ProblemSection />
        <SystemSection />
        <ActivitySection />
        <SolutionSection />
        <CTASection />
        <CinematicFooter />
      </div>
    </SmoothScroller>
  );
};

export default Index;
