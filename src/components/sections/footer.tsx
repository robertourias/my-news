import { Reveal } from "../motion/reveal";

interface FooterProps {
  dateLabel: string;
  articleCount: number;
  aiProvider: string | null;
}

export function Footer({ dateLabel, articleCount, aiProvider }: FooterProps) {
  return (
    <footer className="border-t border-card-border">
      <Reveal className="mx-auto flex w-full max-w-5xl flex-col items-start gap-2 px-5 py-10 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8 xl:max-w-6xl">
        <p>
          Briefing gerado automaticamente · {articleCount} notícias analisadas
          {aiProvider ? ` · IA: ${aiProvider}` : ""}
        </p>
        <p>{dateLabel}</p>
      </Reveal>
    </footer>
  );
}
