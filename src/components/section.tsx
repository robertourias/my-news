import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "./motion/reveal";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  label: string;
  icon: ReactNode;
  /** cor de identidade da categoria — vira --accent nos cards internos */
  accent: string;
  intro?: string | null;
  children: ReactNode;
  className?: string;
}

export function Section({ id, label, icon, accent, intro, children, className }: SectionProps) {
  return (
    <section
      id={id}
      data-section
      aria-labelledby={`${id}-title`}
      className={cn("mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14 xl:max-w-6xl", className)}
      style={{ "--accent": accent } as CSSProperties}
    >
      <Reveal>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl border"
            style={{
              color: "var(--accent)",
              borderColor: "color-mix(in oklab, var(--accent) 25%, transparent)",
              background: "color-mix(in oklab, var(--accent) 10%, transparent)",
            }}
          >
            {icon}
          </span>
          <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight md:text-2xl">
            {label}
          </h2>
        </div>
        {intro && (
          <p className="mt-4 max-w-3xl leading-relaxed text-secondary">{intro}</p>
        )}
      </Reveal>
      <div className="mt-6">{children}</div>
    </section>
  );
}
