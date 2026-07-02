"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ThermometerSun } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";
import { RefreshIndicator } from "../refresh-indicator";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

interface HeroProps {
  greeting: string;
  dateLabel: string;
  updatedTime: string | null;
  temperature: number | null;
  weatherDescription: string | null;
  summary: string;
}

export function Hero({
  greeting,
  dateLabel,
  updatedTime,
  temperature,
  weatherDescription,
  summary,
}: HeroProps) {
  const reduce = useSafeReducedMotion();
  const { scrollY } = useScroll();
  // parallax extremamente leve no gradiente de fundo
  const bgY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 70]);

  const enter = (delay: number) =>
    reduce
      ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: EASE },
      };

  return (
    <header className="relative flex items-center overflow-hidden">
      <m.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ y: bgY, backgroundImage: "var(--gradient-hero)" }}
      />

      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-24 md:px-8 xl:max-w-6xl">
        <m.p {...enter(0)} className="text-sm font-medium tracking-wide text-secondary">
          {dateLabel}
        </m.p>

        <m.h1
          {...enter(0.08)}
          className="mt-3 text-4xl font-semibold tracking-tighter text-foreground md:text-6xl lg:text-7xl"
        >
          {greeting}
        </m.h1>

        <m.p
          {...enter(0.16)}
          className="mt-5 max-w-2xl text-base leading-relaxed text-secondary md:text-lg"
        >
          {summary}
        </m.p>

        <m.div {...enter(0.24)} className="mt-8 flex flex-wrap items-center gap-3">
          {temperature !== null && (
            <span className="inline-flex items-center gap-2 rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary">
              <ThermometerSun className="size-3.5 text-amber-400" aria-hidden />
              <span className="font-semibold text-foreground">{temperature}°C</span>
              {weatherDescription}
            </span>
          )}
          <RefreshIndicator updatedAt={updatedTime} />
        </m.div>
      </div>

      {!reduce && (
        <m.a
          href="#clima"
          aria-label="Rolar para o conteúdo"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted transition-colors duration-250 hover:text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4], y: [0, 6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <ChevronDown className="size-5" aria-hidden />
        </m.a>
      )}
    </header>
  );
}
