"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

/**
 * LazyMotion (strict) reduz o bundle do Framer Motion — só os recursos
 * de animação DOM são carregados. Todos os componentes usam `m.` em vez
 * de `motion.`.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
      <Toaster
        theme="dark"
        position="bottom-center"
        gap={8}
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--card-border)",
            color: "var(--foreground)",
            borderRadius: "12px",
          },
        }}
      />
    </LazyMotion>
  );
}
