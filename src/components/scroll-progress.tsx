"use client";

import { m, useScroll, useSpring } from "framer-motion";

/** Barra de progresso da leitura, fixa no topo. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.4,
  });

  return (
    <m.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400"
      style={{ scaleX }}
    />
  );
}
