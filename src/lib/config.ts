import type { CategoryKey } from "./types";

export const SITE = {
  userName: process.env.USER_NAME || "Roberto",
  timezone: process.env.TZ || "America/Sao_Paulo",
  // Taboão da Serra - SP
  latitude: -23.6096,
  longitude: -46.7917,
} as const;

export const LIMITS = {
  /** Máximo absoluto de notícias enviadas ao Claude por execução */
  maxArticlesTotal: 25,
  maxPerCategory: 5,
  summaryMaxChars: 300,
  feedTimeoutMs: 10_000,
} as const;

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  /** cor de identidade da categoria (usada como --accent no card) */
  accent: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "sao-paulo", label: "São Paulo", accent: "#3b82f6" },
  { key: "taboao", label: "Taboão da Serra", accent: "#14b8a6" },
  { key: "programacao", label: "Programação", accent: "#8b5cf6" },
  { key: "ia", label: "Inteligência Artificial", accent: "#d946ef" },
  { key: "tenis", label: "Tênis", accent: "#84cc16" },
];

export const CATEGORY_BY_KEY = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<CategoryKey, CategoryMeta>;

/** Prefixos curtos para os ids das notícias no prompt */
export const CATEGORY_ID_PREFIX: Record<CategoryKey, string> = {
  "sao-paulo": "sp",
  taboao: "tb",
  programacao: "pg",
  ia: "ia",
  tenis: "tn",
};

export interface FeedSource {
  url: string;
  name: string;
}

const gnews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

export const FEEDS: Record<CategoryKey, FeedSource[]> = {
  "sao-paulo": [
    { url: "https://g1.globo.com/rss/g1/sao-paulo/", name: "G1 São Paulo" },
  ],
  taboao: [
    { url: gnews('"Taboão da Serra"'), name: "Google News" },
  ],
  programacao: [
    { url: "https://hnrss.org/frontpage", name: "Hacker News" },
    { url: "https://dev.to/feed", name: "DEV Community" },
  ],
  ia: [
    { url: gnews("inteligência artificial"), name: "Google News" },
  ],
  tenis: [
    { url: gnews("tênis (ATP OR WTA OR \"Grand Slam\")"), name: "Google News" },
  ],
};
