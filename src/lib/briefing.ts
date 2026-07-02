import { getAIProvider } from "./ai/factory";
import { buildUserPrompt, getSystemPrompt } from "./ai/prompt-builder";
import { parseAIResponse } from "./ai/schema";
import { fetchAgenda } from "./agenda";
import { todayISO } from "./date";
import { collectArticles, contentHash } from "./pipeline";
import { getStorage } from "./storage";
import { fetchWeather } from "./weather";
import type { Briefing } from "./types";

export interface GenerateResult {
  briefing: Briefing;
  status: "generated" | "cached" | "fallback";
}

/** Lock em memória: impede gerações concorrentes (cron + refresh manual). */
let inFlight: Promise<GenerateResult> | null = null;

export async function getLatestBriefing(): Promise<Briefing | null> {
  return getStorage().getLatest();
}

export function generateBriefing(options?: { force?: boolean }): Promise<GenerateResult> {
  if (inFlight) return inFlight;
  inFlight = doGenerate(options?.force ?? false).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doGenerate(force: boolean): Promise<GenerateResult> {
  const date = todayISO();
  const storage = getStorage();

  // Coleta em paralelo: feeds, clima e agenda
  const [articles, weather, agenda] = await Promise.all([
    collectArticles(),
    fetchWeather(),
    fetchAgenda(),
  ]);

  const hash = contentHash({ date, articles, weather, agenda });
  const articleCount = Object.values(articles).reduce((n, a) => n + a.length, 0);

  // Cache inteligente: briefing do dia com hash idêntico → não chama a IA
  const existing = await storage.getByDate(date);
  if (!force && existing?.ai && existing.hash === hash) {
    console.log("[briefing] cache hit — hash idêntico, IA não será chamada");
    return { briefing: existing, status: "cached" };
  }

  const base: Briefing = {
    date,
    hash,
    generatedAt: new Date().toISOString(),
    aiProvider: null,
    weather,
    agenda,
    articles,
    ai: null,
    stats: { articleCount, eventCount: agenda.length },
  };

  // Única chamada diária ao Claude (todo o processamento em um prompt)
  try {
    const provider = getAIProvider();
    const raw = await provider.complete({
      system: getSystemPrompt(),
      user: buildUserPrompt({ date, weather, agenda, articles }),
    });
    base.ai = parseAIResponse(raw);
    base.aiProvider = provider.name;
    await storage.save(base);
    console.log(`[briefing] gerado via ${provider.name} (${articleCount} notícias)`);
    return { briefing: base, status: "generated" };
  } catch (err) {
    console.error("[briefing] falha na IA:", (err as Error).message);
    // Fallback: preserva briefing anterior do dia se houver IA nele
    if (existing?.ai) return { briefing: existing, status: "fallback" };
    await storage.save(base);
    return { briefing: base, status: "fallback" };
  }
}
