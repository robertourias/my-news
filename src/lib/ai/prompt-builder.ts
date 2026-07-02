import { readFileSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, LIMITS } from "../config";
import { formatTime } from "../date";
import type { AgendaEvent, CategoryKey, NormalizedArticle, WeatherData } from "../types";

/**
 * PromptBuilder: compacta as entradas do dia em um único prompt.
 * - remove redundâncias e caracteres reservados
 * - limita tamanho por notícia e total por execução (25)
 * - ordena categorias de forma estável
 * As instruções fixas vivem em prompts/system-prompt.md e nunca são
 * reconstruídas em tempo de execução (cache de módulo + prompt caching na API).
 */

let systemPromptCache: string | null = null;

export function getSystemPrompt(): string {
  if (systemPromptCache) return systemPromptCache;
  const file = path.join(process.cwd(), "prompts", "system-prompt.md");
  systemPromptCache = readFileSync(file, "utf-8").trim();
  return systemPromptCache;
}

const sanitize = (s: string) => s.replace(/\|/g, "/").replace(/\s+/g, " ").trim();

export interface PromptContext {
  date: string;
  weather: WeatherData | null;
  agenda: AgendaEvent[];
  articles: Record<CategoryKey, NormalizedArticle[]>;
}

export function buildUserPrompt(ctx: PromptContext): string {
  const lines: string[] = [`DATA: ${ctx.date}`];

  if (ctx.weather) {
    const w = ctx.weather;
    lines.push(
      `CLIMA: ${w.temperature}°C (sensação ${w.apparentTemperature}°C), min ${w.min}° max ${w.max}°, chuva ${w.precipitationChance}%, ${w.description}`
    );
  } else {
    lines.push("CLIMA: indisponível");
  }

  if (ctx.agenda.length > 0) {
    lines.push(`AGENDA (${ctx.agenda.length}):`);
    for (const ev of ctx.agenda) {
      const time = ev.allDay || !ev.start ? "dia inteiro" : formatTime(ev.start);
      const loc = ev.location ? ` @ ${sanitize(ev.location)}` : "";
      lines.push(`- ${time} ${sanitize(ev.title)}${loc}`);
    }
  } else {
    lines.push("AGENDA: sem compromissos");
  }

  const total = Object.values(ctx.articles).reduce((n, a) => n + a.length, 0);
  lines.push(`NOTICIAS (${total}):`);

  // ordem estável de categorias
  for (const { key } of CATEGORIES) {
    const articles = ctx.articles[key] ?? [];
    if (articles.length === 0) continue;
    lines.push(`[${key}]`);
    for (const a of articles) {
      const summary = sanitize(a.summary).slice(0, LIMITS.summaryMaxChars);
      lines.push(`${a.id}|${sanitize(a.source)}|${sanitize(a.title)}|${summary}`);
    }
  }

  return lines.join("\n");
}
