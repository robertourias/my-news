import { createHash } from "node:crypto";
import type { AgendaEvent, CategoryKey, NormalizedArticle, WeatherData } from "../types";

/**
 * SHA-256 do conteúdo agregado do dia. Se o hash for idêntico ao do último
 * processamento, o briefing existente é reutilizado e a IA não é chamada.
 */
export function contentHash(input: {
  date: string;
  articles: Record<CategoryKey, NormalizedArticle[]>;
  weather: WeatherData | null;
  agenda: AgendaEvent[];
}): string {
  const articleKeys = Object.values(input.articles)
    .flat()
    .map((a) => a.url)
    .sort();

  const weatherKey = input.weather
    ? `${Math.round(input.weather.temperature)}|${input.weather.code}|${input.weather.min}|${input.weather.max}`
    : "none";

  const agendaKey = input.agenda
    .map((e) => `${e.start ?? "allday"}|${e.title}`)
    .sort()
    .join(";");

  return createHash("sha256")
    .update(JSON.stringify({ date: input.date, articleKeys, weatherKey, agendaKey }))
    .digest("hex");
}
