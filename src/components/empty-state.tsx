import { Newspaper } from "lucide-react";
import { Reveal } from "./motion/reveal";
import { RefreshIndicator } from "./refresh-indicator";

/** Estado inicial: briefing ainda não gerado (skeleton + shimmer). */
export function EmptyState() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center gap-8 px-5 py-20">
      <Reveal className="w-full">
        <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-card-border bg-surface">
            <Newspaper className="size-5 text-secondary" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">
            Preparando seu briefing…
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-secondary">
            O briefing do dia é gerado automaticamente na inicialização do
            servidor e todos os dias às 06:00. Aguarde alguns instantes e
            recarregue a página.
          </p>
          <RefreshIndicator updatedAt={null} />
        </div>
      </Reveal>

      <div className="flex w-full flex-col gap-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card shimmer h-28 w-full" />
        ))}
      </div>
    </main>
  );
}
