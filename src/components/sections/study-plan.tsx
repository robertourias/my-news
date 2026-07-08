import { ArrowUpRight } from "lucide-react";
import { Section } from "../section";

interface StudyPlanSectionProps {
  id: string;
  emoji: string;
  label: string;
  accent: string;
  url: string;
}

export function StudyPlanSection({ id, emoji, label, accent, url }: StudyPlanSectionProps) {
  return (
    <Section
      id={id}
      label={label}
      accent={accent}
      icon={<span className="text-base leading-none">{emoji}</span>}
      collapsible
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-card group flex items-center justify-between gap-4 p-5"
      >
        <span className="text-sm font-medium text-foreground">Abrir plano de estudos</span>
        <ArrowUpRight
          className="size-4 shrink-0 transition-transform duration-250 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          style={{ color: "var(--accent)" }}
          aria-hidden
        />
      </a>
    </Section>
  );
}
