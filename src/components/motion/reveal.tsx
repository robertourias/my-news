"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fade + slide up + scale 0.98 → 1, disparado ao entrar na viewport (uma vez). */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useSafeReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } },
};

/** Container com stagger children — anima apenas dentro da viewport. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useSafeReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={containerVariants}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={itemVariants}>
      {children}
    </m.div>
  );
}
