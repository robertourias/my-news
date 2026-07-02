import { CloudSun, Droplets, Umbrella, Wind } from "lucide-react";
import type { WeatherData } from "@/lib/types";
import { Section } from "../section";
import { Stagger, StaggerItem } from "../motion/reveal";

interface WeatherSectionProps {
  weather: WeatherData | null;
  aiSummary?: string | null;
}

export function WeatherSection({ weather, aiSummary }: WeatherSectionProps) {
  return (
    <Section
      id="clima"
      label="Clima"
      accent="#38bdf8"
      icon={<CloudSun className="size-4.5" aria-hidden />}
      intro={aiSummary}
    >
      {weather ? (
        <Stagger className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
          <StaggerItem className="h-full">
            <div className="glass-card flex h-full flex-col justify-center gap-1 p-6 md:p-8">
              <span className="text-5xl font-semibold tracking-tighter md:text-6xl">
                {weather.temperature}°
              </span>
              <span className="capitalize text-secondary">{weather.description}</span>
              <span className="text-sm text-muted">
                Sensação de {weather.apparentTemperature}°C
              </span>
            </div>
          </StaggerItem>

          <StaggerItem className="h-full">
            <div className="grid h-full grid-cols-2 gap-4">
              <Stat label="Mín / Máx" value={`${weather.min}° / ${weather.max}°`} icon={<CloudSun className="size-4" aria-hidden />} />
              <Stat label="Chuva" value={`${weather.precipitationChance}%`} icon={<Umbrella className="size-4" aria-hidden />} />
              <Stat label="Umidade" value={`${weather.humidity}%`} icon={<Droplets className="size-4" aria-hidden />} />
              <Stat label="Vento" value={`${weather.windSpeed} km/h`} icon={<Wind className="size-4" aria-hidden />} />
            </div>
          </StaggerItem>
        </Stagger>
      ) : (
        <p className="glass-card p-6 text-sm text-muted">
          Dados de clima indisponíveis no momento.
        </p>
      )}
    </Section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col justify-center gap-1.5 p-5">
      <span className="inline-flex items-center gap-2 text-xs text-muted">
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        {label}
      </span>
      <span className="text-lg font-semibold tracking-tight">{value}</span>
    </div>
  );
}
