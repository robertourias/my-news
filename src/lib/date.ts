import { SITE } from "./config";

/** YYYY-MM-DD no fuso configurado */
export function todayISO(tz = SITE.timezone): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatFullDate(date = new Date(), tz = SITE.timezone): string {
  const s = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTime(iso: string, tz = SITE.timezone): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function currentHour(tz = SITE.timezone): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
}

export function greeting(name?: string, tz = SITE.timezone): string {
  const h = currentHour(tz);
  const base = h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${base}, ${name}` : base;
}
