"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
  /** quando true, o header vira um toggle e o conteúdo pode ser escondido */
  collapsible?: boolean;
  /** estado inicial quando collapsible=true (padrão: fechado) */
  defaultOpen?: boolean;
}

export function Section({
  id,
  label,
  icon,
  accent,
  intro,
  children,
  className,
  collapsible = false,
  defaultOpen = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;

  return (
    <section
      id={id}
      data-section
      aria-labelledby={`${id}-title`}
      className={cn(
        "mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14 xl:max-w-6xl",
        collapsible && "border-t border-[color:var(--card-border)]",
        className
      )}
      style={{ "--accent": accent } as CSSProperties}
    >
      <Reveal>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-controls={`${id}-content`}
            className="flex w-full cursor-pointer items-center gap-3 text-left"
          >
            <SectionIcon>{icon}</SectionIcon>
            <h2 id={`${id}-title`} className="flex-1 text-xl font-semibold tracking-tight md:text-2xl">
              {label}
            </h2>
            <ChevronDown
              className={cn(
                "size-5 shrink-0 text-muted transition-transform duration-250 ease-smooth",
                isOpen && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <SectionIcon>{icon}</SectionIcon>
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight md:text-2xl">
              {label}
            </h2>
          </div>
        )}
        {intro && isOpen && (
          <p className="mt-4 max-w-3xl leading-relaxed text-secondary">{intro}</p>
        )}
      </Reveal>
      {isOpen && (
        <div id={`${id}-content`} className="mt-6">
          {children}
        </div>
      )}
    </section>
  );
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-9 items-center justify-center rounded-xl border"
      style={{
        color: "var(--accent)",
        borderColor: "color-mix(in oklab, var(--accent) 25%, transparent)",
        background: "color-mix(in oklab, var(--accent) 10%, transparent)",
      }}
    >
      {children}
    </span>
  );
}
