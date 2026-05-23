import logo from "@/assets/logo.png";
import { Github, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 py-10 md:py-12 px-6">
      {/* Animated shimmer line */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(160 100% 45% / 0.6) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-line 6s ease-in-out infinite",
        }}
      />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <img src={logo} alt="TerraLedger" className="w-6 h-6" />
          <span className="text-sm font-semibold">TerraLedger</span>
        </div>
        <div className="flex items-center flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href="#" className="story-link hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="story-link hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="story-link hover:text-foreground transition-colors">Documentation</a>
          <a href="#" className="story-link hover:text-foreground transition-colors">GitHub</a>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[
              { icon: Github, label: "GitHub" },
              { icon: Twitter, label: "X" },
              { icon: MessageCircle, label: "Discord" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground hidden md:block ml-2">© 2026 TerraLedger. All rights reserved.</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6 md:hidden">© 2026 TerraLedger. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
