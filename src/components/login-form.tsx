"use client";

import { useActionState, useEffect, useState } from "react";
import {
  sendCodeAction,
  verifyCodeAction,
  type SendCodeState,
  type VerifyCodeState,
} from "@/app/login/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialSendState: SendCodeState = { ok: false };
const initialVerifyState: VerifyCodeState = { ok: false };

interface LoginFormProps {
  turnstileSiteKey: string;
}

export function LoginForm({ turnstileSiteKey }: LoginFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [sendState, sendAction, sendPending] = useActionState(sendCodeAction, initialSendState);
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyCodeAction,
    initialVerifyState
  );

  useEffect(() => {
    if (sendState.ok) setStep("code");
  }, [sendState]);

  if (step === "email") {
    return (
      <form action={sendAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-secondary">Email</span>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-card-border bg-surface px-3.5 py-2.5 text-foreground outline-none focus:border-[var(--accent-hero)]"
          />
        </label>
        <TurnstileWidget siteKey={turnstileSiteKey} />
        {sendState.error && <p className="text-sm text-red-400">{sendState.error}</p>}
        <button
          type="submit"
          disabled={sendPending}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {sendPending ? "Enviando…" : "Enviar código"}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-secondary">Enviamos um código de 6 dígitos para {email}.</p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-secondary">Código</span>
        <input
          type="text"
          name="code"
          required
          maxLength={6}
          inputMode="numeric"
          autoFocus
          className="rounded-lg border border-card-border bg-surface px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-foreground outline-none focus:border-[var(--accent-hero)]"
        />
      </label>
      {verifyState.error && <p className="text-sm text-red-400">{verifyState.error}</p>}
      <button
        type="submit"
        disabled={verifyPending}
        className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {verifyPending ? "Verificando…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setStep("email")}
        className="text-xs text-muted underline-offset-2 hover:underline"
      >
        Usar outro email
      </button>
    </form>
  );
}
