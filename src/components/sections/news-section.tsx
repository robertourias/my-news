import { ArrowUpRight, Building2, Code2, MapPin, Sparkles, Trophy } from "lucide-react";
import type { AISection, CategoryKey, NormalizedArticle } from "@/lib/types";
import { CATEGORY_BY_KEY, SITE } from "@/lib/config";
import { Section } from "../section";
import { Stagger, StaggerItem } from "../motion/reveal";

const ICONS: Record<CategoryKey, React.ReactNode> = {
  "sao-paulo": <Building2 className="size-4.5" aria-hidden />,
  taboao: <MapPin className="size-4.5" aria-hidden />,
  programacao: <Code2 className="size-4.5" aria-hidden />,
  ia: <Sparkles className="size-4.5" aria-hidden />,
  tenis: <Trophy className="size-4.5" aria-hidden />,
};

interface NewsSectionProps {
  category: CategoryKey;
  articles: NormalizedArticle[];
  ai?: AISection | null;
}

export function NewsSection({ category, articles, ai }: NewsSectionProps) {
  const meta = CATEGORY_BY_KEY[category];
  const highlights = new Map((ai?.highlights ?? []).map((h) => [h.id, h.note]));

  return (
    <Section
      id={category}
      label={meta.label}
      accent={meta.accent}
      icon={ICONS[category]}
      intro={ai?.summary}
    >
      {articles.length === 0 ? (
        <p className="glass-card p-6 text-sm text-muted">Sem notícias nesta categoria hoje.</p>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <StaggerItem key={article.id} className="h-full">
              <ArticleCard article={article} highlightNote={highlights.get(article.id)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

function formatPublished(iso: string): string {
  const date = new Date(iso);
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone: SITE.timezone, dateStyle: "short" }).format(date) ===
    new Intl.DateTimeFormat("en-CA", { timeZone: SITE.timezone, dateStyle: "short" }).format(new Date());
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SITE.timezone,
    ...(sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }),
  }).format(date);
}

function ArticleCard({
  article,
  highlightNote,
}: {
  article: NormalizedArticle;
  highlightNote?: string;
}) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card group flex h-full flex-col gap-3 p-5"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-medium" style={{ color: "var(--accent)" }}>
          {article.source}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-muted">
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
          )}
          <ArrowUpRight
            className="size-3.5 transition-transform duration-250 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>

      <h3 className="text-[15px] font-medium leading-snug text-foreground">
        {article.title}
      </h3>

      {article.summary && (
        <p className="line-clamp-3 text-sm leading-relaxed text-secondary">{article.summary}</p>
      )}

      {highlightNote && (
        <p
          className="mt-auto flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed"
          style={{
            borderColor: "color-mix(in oklab, var(--accent) 25%, transparent)",
            background: "color-mix(in oklab, var(--accent) 7%, transparent)",
            color: "color-mix(in oklab, var(--accent) 60%, var(--foreground))",
          }}
        >
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {highlightNote}
        </p>
      )}
    </a>
  );
}
