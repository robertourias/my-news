"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copiar", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={cn(
        "ripple inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-card-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors duration-150 hover:border-muted hover:text-foreground",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}
