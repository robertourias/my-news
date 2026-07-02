import { z } from "zod";
import type { AIBriefing } from "../types";

const categoryEnum = z.enum(["sao-paulo", "taboao", "programacao", "ia", "tenis"]);

export const aiBriefingSchema = z.object({
  heroSummary: z.string().min(1),
  weatherSummary: z.string().default(""),
  dailyQuote: z
    .object({ text: z.string(), author: z.string().default("") })
    .default({ text: "", author: "" }),
  agendaSummary: z.string().default(""),
  sections: z
    .array(
      z.object({
        category: categoryEnum,
        summary: z.string(),
        highlights: z
          .array(z.object({ id: z.string(), note: z.string() }))
          .default([]),
      })
    )
    .default([]),
  dailyInsights: z.array(z.string()).default([]),
});

/** Extrai e valida o JSON da resposta do provedor (tolerante a cercas/texto extra). */
export function parseAIResponse(raw: string): AIBriefing {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Resposta da IA não contém JSON");
  }

  const parsed = JSON.parse(text.slice(start, end + 1));
  return aiBriefingSchema.parse(parsed) as AIBriefing;
}
