import { LIMITS } from "../config";
import type { CategoryKey, NormalizedArticle } from "../types";
import { dedupe } from "./dedupe";
import { fetchAllFeeds } from "./fetch-feeds";
import { normalize } from "./normalize";

export { contentHash } from "./hash";

/**
 * RSS/APIs → Parser → Normalizador → Deduplicação → Agrupamento por categoria
 * Aplica o teto de 5 por categoria e 25 no total.
 */
export async function collectArticles(): Promise<Record<CategoryKey, NormalizedArticle[]>> {
  const raw = await fetchAllFeeds();

  const grouped = {} as Record<CategoryKey, NormalizedArticle[]>;
  let total = 0;

  for (const [category, articles] of Object.entries(raw) as [CategoryKey, typeof raw[CategoryKey]][]) {
    const budget = Math.min(
      LIMITS.maxPerCategory,
      Math.max(0, LIMITS.maxArticlesTotal - total)
    );
    const items = dedupe(normalize(category, articles)).slice(0, budget);
    grouped[category] = items;
    total += items.length;
  }

  return grouped;
}
