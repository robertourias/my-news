import { auth } from "@/auth";
import { getLatestBriefing } from "@/lib/briefing";
import { CATEGORIES } from "@/lib/config";
import { formatFullDate, formatTime, greeting } from "@/lib/date";
import type { AISection, CategoryKey } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { Nav } from "@/components/nav";
import { ReadingFocus } from "@/components/reading-focus";
import { ScrollProgress } from "@/components/scroll-progress";
import { AgendaSection } from "@/components/sections/agenda";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { InsightsSection } from "@/components/sections/insights";
import { NewsSection } from "@/components/sections/news-section";
import { QuoteSection } from "@/components/sections/quote";
import { StudyPlanSection } from "@/components/sections/study-plan";
import { WeatherSection } from "@/components/sections/weather";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [briefing, session] = await Promise.all([getLatestBriefing(), auth()]);
  const isAuthenticated = Boolean(session?.user);

  if (!briefing) {
    return (
      <>
        <ScrollProgress />
        <Nav />
        <EmptyState />
      </>
    );
  }

  const { ai, weather, agenda, articles, stats } = briefing;
  const aiSections = new Map<CategoryKey, AISection>(
    (ai?.sections ?? []).map((s) => [s.category, s])
  );

  const heroSummary =
    ai?.heroSummary ??
    `Hoje existem ${stats.articleCount} notícias relevantes e ${stats.eventCount} compromissos na agenda.`;

  return (
    <>
      <ScrollProgress />
      <ReadingFocus />

      <Nav />

      <Hero
        greeting={greeting(session?.user?.name ?? undefined)}
        dateLabel={formatFullDate()}
        updatedTime={formatTime(briefing.generatedAt)}
        temperature={weather?.temperature ?? null}
        weatherDescription={weather?.description ?? null}
        summary={heroSummary}
      />

      <main>
        <WeatherSection weather={weather} aiSummary={ai?.weatherSummary} />

        <StudyPlanSection
          id="estudos-dev"
          emoji="🧠"
          label="Plano de Estudos — Dev & IA"
          accent="#a78bfa"
          url="https://claude.ai/public/artifacts/16cb8ae5-12c1-4b3b-8049-e9fca027c179"
        />

        <StudyPlanSection
          id="estudos-linguas"
          emoji="🎸"
          label="Plano de Estudos — Inglês & Espanhol"
          accent="#fb7185"
          url="https://claude.ai/public/artifacts/179a5f1f-5692-468c-a76e-5d6b62b45411"
        />

        {ai?.dailyQuote.text && (
          <QuoteSection text={ai.dailyQuote.text} author={ai.dailyQuote.author} />
        )}

        {isAuthenticated && (
          <AgendaSection events={agenda} aiSummary={ai?.agendaSummary} />
        )}

        {CATEGORIES.map(({ key }) => (
          <NewsSection
            key={key}
            category={key}
            articles={articles[key] ?? []}
            ai={aiSections.get(key)}
          />
        ))}

        <InsightsSection insights={ai?.dailyInsights ?? []} />
      </main>

      <Footer
        dateLabel={formatFullDate(new Date(briefing.generatedAt))}
        articleCount={stats.articleCount}
        aiProvider={briefing.aiProvider}
      />
    </>
  );
}
