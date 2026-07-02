import { CATEGORY_ID_PREFIX, LIMITS } from "../config";
import type { CategoryKey, NormalizedArticle, RawArticle } from "../types";

/** Remove HTML, scripts, entidades e espaços redundantes. */
export function cleanText(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/https?:\/\/\S+/g, "") // URLs soltas no corpo não agregam
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max)}…`;
}

/**
 * Normaliza artigos brutos: limpa HTML, corta o resumo em 300 caracteres,
 * descarta itens sem título/link e atribui ids curtos por categoria.
 */
export function normalize(
  category: CategoryKey,
  articles: RawArticle[]
): NormalizedArticle[] {
  const prefix = CATEGORY_ID_PREFIX[category];
  return articles
    .filter((a) => a.title && a.link)
    .map((a, i) => ({
      id: `${prefix}${i + 1}`,
      category,
      title: truncate(cleanText(a.title), 160),
      source: cleanText(a.source).slice(0, 60) || "—",
      url: a.link,
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : null,
      summary: truncate(cleanText(a.snippet ?? ""), LIMITS.summaryMaxChars),
    }));
}
