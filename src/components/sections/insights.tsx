import { Lightbulb } from "lucide-react";
import { Section } from "../section";
import { Stagger, StaggerItem } from "../motion/reveal";
import { CopyButton } from "../copy-button";

interface InsightsSectionProps {
  insights: string[];
}

export function InsightsSection({ insights }: InsightsSectionProps) {
  if (insights.length === 0) return null;

  return (
    <Section
      id="insights"
      label="Insights do dia"
      accent="#fb923c"
      icon={<Lightbulb className="size-4.5" aria-hidden />}
    >
      <Stagger className="grid gap-4 lg:grid-cols-3">
        {insights.map((insight, i) => (
          <StaggerItem key={i} className="h-full">
            <div className="glass-card flex h-full flex-col gap-4 p-6">
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-sm leading-relaxed text-secondary">{insight}</p>
              <CopyButton text={insight} className="self-start" />
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
