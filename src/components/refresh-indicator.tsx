"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  updatedAt: string | null;
}

/** Indicador de atualização + recarga suave do conteúdo (RSC refresh). */
export function RefreshIndicator({ updatedAt }: RefreshIndicatorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
      toast.success("Conteúdo atualizado");
    });
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary">
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-emerald-400 [animation:var(--animate-pulse-dot)]"
      />
      {updatedAt ? `Atualizado às ${updatedAt}` : "Aguardando geração"}
      <button
        type="button"
        onClick={handleRefresh}
        aria-label="Recarregar conteúdo"
        className="ripple -mr-1 cursor-pointer rounded-full p-1 transition-colors duration-150 hover:text-foreground"
      >
        <RotateCw className={cn("size-3.5", isPending && "animate-spin")} aria-hidden />
      </button>
    </span>
  );
}
