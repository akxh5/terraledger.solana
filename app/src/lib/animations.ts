export const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, delay, ease: "easeOut" as const },
});

export const fadeIn = (delay: number = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export const scaleIn = (delay: number = 0) => ({
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

export const hoverScale = {
  whileHover: { scale: 1.03 },
  transition: { duration: 0.3 },
};

export const hoverGlow = {
  whileHover: {
    scale: 1.03,
    boxShadow: "0 0 30px rgba(0,230,154,0.3), 0 0 60px rgba(0,230,154,0.1)",
  },
  transition: { duration: 0.3 },
};
