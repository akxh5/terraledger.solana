import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import ShaderBackdrop from "@/components/ShaderBackdrop";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface Packet {
  fromIdx: number;
  toIdx: number;
  t: number;
  speed: number;
}

const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes: Node[] = [];
    const packets: Packet[] = [];

    const computeCount = () =>
      Math.min(110, Math.max(45, Math.floor((window.innerWidth * window.innerHeight) / 22000)));

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const seed = () => {
      nodes.length = 0;
      const count = computeCount();
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    seed();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseleave", onLeave);

    const spawnPacket = () => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      if (to === from) to = (to + 1) % nodes.length;
      packets.push({
        fromIdx: from,
        toIdx: to,
        t: 0,
        speed: 0.004 + Math.random() * 0.006,
      });
    };
    const packetInterval = window.setInterval(spawnPacket, 700);

    const MAX_DIST = 180;
    const MOUSE_RADIUS = 160;

    const draw = (time: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            let alpha = (1 - dist / MAX_DIST) * 0.18;
            // brighten near mouse
            const mxA = (a.x + b.x) / 2 - mx;
            const myA = (a.y + b.y) / 2 - my;
            const mDist = Math.sqrt(mxA * mxA + myA * myA);
            if (mDist < MOUSE_RADIUS) {
              alpha += (1 - mDist / MOUSE_RADIUS) * 0.35;
            }
            ctx.strokeStyle = `rgba(0, 230, 154, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const node of nodes) {
        const pulse = 0.55 + Math.sin(time * 0.0015 + node.phase) * 0.35;
        // glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 6);
        grad.addColorStop(0, `rgba(0, 230, 154, ${0.5 * pulse})`);
        grad.addColorStop(1, "rgba(0, 230, 154, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 255, 220, ${0.55 + pulse * 0.4})`;
        ctx.fill();

        // movement + slight mouse repulsion
        if (mx > -9000) {
          const ddx = node.x - mx;
          const ddy = node.y - my;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 1) {
            const f = (1 - Math.sqrt(d2) / MOUSE_RADIUS) * 0.4;
            node.vx += (ddx / Math.sqrt(d2)) * f * 0.05;
            node.vy += (ddy / Math.sqrt(d2)) * f * 0.05;
          }
        }
        // damp
        node.vx *= 0.995;
        node.vy *= 0.995;
        // clamp velocity
        const sp = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        const maxSp = 0.6;
        if (sp > maxSp) {
          node.vx = (node.vx / sp) * maxSp;
          node.vy = (node.vy / sp) * maxSp;
        }
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;
      }

      // Data packets travelling along edges
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        const a = nodes[p.fromIdx];
        const b = nodes[p.toIdx];
        if (!a || !b) {
          packets.splice(i, 1);
          continue;
        }
        p.t += p.speed;
        if (p.t >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10);
        grad.addColorStop(0, "rgba(120, 255, 200, 0.95)");
        grad.addColorStop(1, "rgba(0, 230, 154, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(220, 255, 235, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(packetInterval);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Ambient WebGL shader rings (back layer) */}
      <ShaderBackdrop />

      {/* Aurora drifting orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, hsl(160 100% 45% / 0.18), transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, hsl(170 90% 55% / 0.14), transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, -60, 30, 0], y: [0, 60, -30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 left-1/4 w-[40rem] h-[40rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, hsl(150 100% 50% / 0.12), transparent 60%)",
          filter: "blur(90px)",
        }}
        animate={{ x: [0, 50, -50, 0], y: [0, -40, 40, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 100% 45% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(160 100% 45% / 0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6 }}
      />

      {/* Vignette to ground content */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.6) 100%)",
        }}
      />
    </div>
  );
};

export default NetworkBackground;
