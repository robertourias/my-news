export type CategoryKey = "sao-paulo" | "taboao" | "programacao" | "ia" | "tenis";

export interface RawArticle {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
}

export interface NormalizedArticle {
  /** id curto e estável usado no prompt e na resposta da IA (ex.: "sp1") */
  id: string;
  category: CategoryKey;
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  /** resumo bruto, máx. 300 caracteres, sem HTML */
  summary: string;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
  description: string;
  min: number;
  max: number;
  precipitationChance: number;
}

export interface AgendaEvent {
  title: string;
  /** ISO string ou null para eventos de dia inteiro */
  start: string | null;
  location?: string;
  allDay: boolean;
}

export interface AIHighlight {
  id: string;
  note: string;
}

export interface AISection {
  category: CategoryKey;
  summary: string;
  highlights: AIHighlight[];
}

export interface AIBriefing {
  heroSummary: string;
  weatherSummary: string;
  dailyQuote: { text: string; author: string };
  agendaSummary: string;
  sections: AISection[];
  dailyInsights: string[];
}

export interface Briefing {
  date: string; // YYYY-MM-DD
  hash: string; // SHA-256 do conteúdo agregado
  generatedAt: string; // ISO
  aiProvider: string | null;
  weather: WeatherData | null;
  agenda: AgendaEvent[];
  articles: Record<CategoryKey, NormalizedArticle[]>;
  ai: AIBriefing | null;
  stats: { articleCount: number; eventCount: number };
}
