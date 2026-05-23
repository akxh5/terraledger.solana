import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiteNetworkBackground from "@/components/LiteNetworkBackground";
import AnimatedBorder from "@/components/AnimatedBorder";
import logo from "@/assets/logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <LiteNetworkBackground density={0.6} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src={logo} alt="TerraLedger" className="w-7 h-7" />
          <span className="text-sm font-bold">TerraLedger</span>
        </Link>

        <h1
          className="font-serif-italic text-gradient-primary glitch-text text-[8rem] md:text-[12rem] leading-none font-bold mb-2"
          data-text="404"
        >
          404
        </h1>

        <AnimatedBorder rounded="rounded-2xl" className="mb-6">
          <div className="liquid-glass rounded-2xl px-6 py-8 md:px-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Page <span className="font-serif-italic text-gradient-primary">not found</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6">
              The record you're looking for is not available on this ledger.
              <br />
              Route: <code className="text-xs font-mono text-primary/80">{location.pathname}</code>
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-8">
              <Link to="/" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 text-sm font-semibold rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                  style={{ animation: "pulse-halo 3s ease-in-out infinite" }}
                >
                  <Home size={16} />
                  Return Home
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 text-sm font-semibold rounded-xl gap-2 liquid-glass border-0 text-foreground hover:text-foreground hover:bg-primary/10"
                >
                  <LayoutDashboard size={16} />
                  Open Dashboard
                </Button>
              </Link>
            </div>

            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Compass size={12} />
                You may want to explore:
              </p>
              <ul className="space-y-1">
                {[
                  { to: "/", label: "Home" },
                  { to: "/dashboard", label: "Dashboard" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                    >
                      <span>{link.label}</span>
                      <ArrowRight
                        size={14}
                        className="-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary transition-all"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedBorder>
      </motion.div>
    </div>
  );
};

export default NotFound;
