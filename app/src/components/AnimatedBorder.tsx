import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  rounded?: string;
}

/**
 * Wraps children with an animated emerald gradient border (rotating conic gradient).
 * Decorative — pointer events pass through the border ring.
 */
const AnimatedBorder = ({ children, className, rounded = "rounded-2xl" }: AnimatedBorderProps) => {
  return (
    <div className={cn("relative", rounded, className)}>
      <div
        aria-hidden
        className={cn("absolute -inset-[1px] pointer-events-none overflow-hidden opacity-70", rounded)}
        style={{
          background:
            "conic-gradient(from var(--angle, 0deg), transparent 0deg, hsl(160 100% 45% / 0.6) 60deg, transparent 120deg, transparent 240deg, hsl(160 80% 55% / 0.5) 300deg, transparent 360deg)",
          animation: "border-spin 8s linear infinite",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />
      <div className={cn("relative", rounded)}>{children}</div>
    </div>
  );
};

export default AnimatedBorder;
