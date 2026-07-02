import Parser from "rss-parser";
import { FEEDS, LIMITS } from "../config";
import type { CategoryKey, RawArticle } from "../types";

const parser = new Parser({
  timeout: LIMITS.feedTimeoutMs,
  headers: { "User-Agent": "daily-briefing/1.0 (+rss-reader)" },
});

async function fetchFeed(url: string, sourceName: string): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).map((item) => ({
      title: item.title?.trim() ?? "",
      link: item.link?.trim() ?? "",
      source: item.creator?.trim() || sourceName,
      publishedAt: item.isoDate || item.pubDate,
      snippet: item.contentSnippet || item.content || "",
    }));
  } catch (err) {
    console.error(`[pipeline] falha no feed ${sourceName} (${url}):`, (err as Error).message);
    return [];
  }
}

/** Busca todos os feeds em paralelo, agrupados por categoria. */
export async function fetchAllFeeds(): Promise<Record<CategoryKey, RawArticle[]>> {
  const entries = await Promise.all(
    (Object.entries(FEEDS) as [CategoryKey, typeof FEEDS[CategoryKey]][]).map(
      async ([category, sources]) => {
        const results = await Promise.all(
          sources.map((s) => fetchFeed(s.url, s.name))
        );
        return [category, results.flat()] as const;
      }
    )
  );
  return Object.fromEntries(entries) as Record<CategoryKey, RawArticle[]>;
}
