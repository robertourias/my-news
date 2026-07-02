import { Quote as QuoteIcon } from "lucide-react";
import { Section } from "../section";
import { Reveal } from "../motion/reveal";
import { CopyButton } from "../copy-button";

interface QuoteSectionProps {
  text: string;
  author: string;
}

export function QuoteSection({ text, author }: QuoteSectionProps) {
  const full = author ? `"${text}" — ${author}` : `"${text}"`;

  return (
    <Section
      id="frase"
      label="Frase do dia"
      accent="#f472b6"
      icon={<QuoteIcon className="size-4.5" aria-hidden />}
    >
      <Reveal>
        <figure className="glass-card relative overflow-hidden p-8 md:p-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(40rem 16rem at 80% 0%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 65%)",
            }}
          />
          <blockquote className="max-w-3xl text-xl font-medium leading-relaxed tracking-tight text-foreground md:text-2xl">
            “{text}”
          </blockquote>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {author && (
              <figcaption className="text-sm text-secondary">— {author}</figcaption>
            )}
            <CopyButton text={full} />
          </div>
        </figure>
      </Reveal>
    </Section>
  );
}
