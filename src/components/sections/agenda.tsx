import { CalendarDays, MapPin, Pill } from "lucide-react";
import type { AgendaEvent } from "@/lib/types";
import { formatTime } from "@/lib/date";
import { Section } from "../section";
import { Stagger, StaggerItem } from "../motion/reveal";

interface AgendaSectionProps {
  events: AgendaEvent[];
  aiSummary?: string | null;
}

export function AgendaSection({ events, aiSummary }: AgendaSectionProps) {
  return (
    <Section
      id="agenda"
      label="Agenda"
      accent="#fbbf24"
      icon={<CalendarDays className="size-4.5" aria-hidden />}
      intro={aiSummary}
      collapsible
    >
      {events.length === 0 ? (
        <p className="glass-card p-6 text-sm text-secondary">
          Nenhum compromisso hoje — dia livre para o que importa.
        </p>
      ) : (
        <Stagger className="flex flex-col gap-3">
          {events.map((event, i) => {
            const isSupplement = event.kind === "supplement";
            const tone = isSupplement ? "#2dd4bf" : "var(--accent)";
            return (
              <StaggerItem key={`${event.title}-${i}`}>
                <div className="glass-card flex items-center gap-4 p-4 md:p-5">
                  <span
                    className="inline-flex min-w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tabular-nums"
                    style={{
                      color: tone,
                      borderColor: `color-mix(in oklab, ${tone} 25%, transparent)`,
                      background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                    }}
                  >
                    {isSupplement && <Pill className="size-3.5 shrink-0" aria-hidden />}
                    {event.allDay || !event.start ? "Dia todo" : formatTime(event.start)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{event.title}</p>
                    {event.location && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                        <MapPin className="size-3 shrink-0" aria-hidden />
                        {event.location}
                      </p>
                    )}
                    {event.reason && (
                      <p className="mt-0.5 text-[0.7rem] leading-snug text-muted">{event.reason}</p>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </Section>
  );
}
