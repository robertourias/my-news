import type { NormalizedArticle } from "../types";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(title: string): Set<string> {
  return new Set(normalizeTitle(title).split(" ").filter((w) => w.length > 3));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Remove duplicatas por URL e por similaridade de título (Jaccard > 0.7),
 * preservando a primeira ocorrência (feeds mais prioritários vêm antes).
 */
export function dedupe(articles: NormalizedArticle[]): NormalizedArticle[] {
  const seenUrls = new Set<string>();
  const kept: { article: NormalizedArticle; words: Set<string> }[] = [];

  for (const article of articles) {
    const urlKey = article.url.replace(/[?#].*$/, "");
    if (seenUrls.has(urlKey)) continue;

    const words = wordSet(article.title);
    if (kept.some((k) => jaccard(k.words, words) > 0.7)) continue;

    seenUrls.add(urlKey);
    kept.push({ article, words });
  }

  return kept.map((k) => k.article);
}
