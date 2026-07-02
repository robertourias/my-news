# NextAuth Email-OTP Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add passwordless login (Auth.js v5 Credentials provider + 6-digit email code + Cloudflare Turnstile) so the homepage stays public for news, but only the authenticated owner sees the agenda section and their name in the greeting.

**Architecture:** Auth.js v5 (`next-auth@beta`) with a Credentials provider, JWT session (no DB adapter). A 2-step client form (`useActionState`) drives two server actions: `sendCodeAction` (Turnstile verify → rate limit → generate + email a 6-digit code via Resend) and `verifyCodeAction` (calls `signIn("credentials", ...)`, which checks the code against an in-memory store). No middleware — `src/app/page.tsx` reads `auth()` directly and conditionally renders the agenda section and personalized greeting.

**Tech Stack:** Next.js 15 App Router, React 19 (`useActionState`), `next-auth@beta` (Auth.js v5), `resend`, Cloudflare Turnstile (script-only, no npm package), `zod` (already a dependency).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-02-nextauth-email-otp-design.md` — every requirement there applies to every task below.
- Only `AUTH_EMAIL` (env var) may authenticate. Every other email gets the exact same generic response (spec's anti-enumeration requirement).
- Session is JWT-only, no database adapter, no `middleware.ts`.
- This project has **no automated test framework** (`package.json` only has `typecheck`, `build`, `dev`, `start` — confirmed by reading it). Per the spec's own "Testes manuais" section, verification is `npm run typecheck` after each code task plus a full manual end-to-end pass (browser + the 8 scenarios from the spec) as the final task. Do not introduce a test framework as part of this plan.
- UI copy in Portuguese, matching the rest of the app (see `src/components/empty-state.tsx`, `src/components/sections/footer.tsx` for tone/style reference).
- Path alias `@/*` → `./src/*` (see `tsconfig.json`).
- Node 22 (see `Dockerfile`, `node:22-alpine`).
- Env vars use the Auth.js v5 convention (`AUTH_SECRET`, `AUTH_TRUST_HOST`), not the legacy v4 `NEXTAUTH_*` names from the spec draft — v5 auto-infers `AUTH_SECRET`/`AUTH_URL` and needs `AUTH_TRUST_HOST=true` behind the existing Traefik reverse proxy. This is a same-behavior naming correction, not a spec deviation.
- Turnstile site key is exposed to the client as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Next.js convention for client-visible env vars) instead of the spec's `TURNSTILE_SITE_KEY` — same value, correct Next.js naming. `TURNSTILE_SECRET_KEY` stays server-only, unchanged.
- The spec listed a `POST /api/auth/send-code` route handler; this plan implements it as a Server Action (`src/app/login/actions.ts`) instead. Same validation order (Turnstile → allowlist check → rate limit → issue + send code), same generic responses — just idiomatic App-Router wiring that pairs directly with `useActionState`, avoiding a hand-rolled `fetch`/JSON layer.

---

### Task 1: Dependencies and environment variables

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `next-auth@beta` and `resend` available as imports for every later task.

- [ ] **Step 1: Install dependencies**

```bash
npm install next-auth@beta resend
```

- [ ] **Step 2: Add new env vars to `.env.example`**

Add this block after the existing `# ── Deploy ...` section (end of file):

```
# ── Autenticação (login por código de 6 dígitos) ───────────────────
# Segredo usado para assinar o cookie de sessão JWT. Gere com:
# openssl rand -base64 33
AUTH_SECRET=
# Necessário atrás de proxy reverso (Traefik já configurado na VPS)
AUTH_TRUST_HOST=true
# Único email que pode logar
AUTH_EMAIL=seu-email@gmail.com

# ── Resend (envio do código por e-mail) ─────────────────────────────
RESEND_API_KEY=
RESEND_FROM=briefing@seu-dominio.com

# ── Cloudflare Turnstile (captcha invisível no login) ───────────────
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 3: Verify `package.json` picked up the new deps**

Run: `cat package.json | grep -E "next-auth|resend"`
Expected: two lines showing `"next-auth": "5.0.0-beta..."` and `"resend": "^6..."` (exact patch versions may differ — that's fine).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add next-auth and resend dependencies for email-OTP login"
```

---

### Task 2: OTP store (in-memory)

**Files:**
- Create: `src/lib/auth/otp-store.ts`

**Interfaces:**
- Produces: `issueCode(email: string): string`, `consumeCode(email: string, code: string): boolean`

- [ ] **Step 1: Write the file**

```ts
import { randomInt } from "node:crypto";

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpEntry>();

/** Gera e guarda um código de 6 dígitos para o email (uso único, expira em 10min). */
export function issueCode(email: string): string {
  const code = randomInt(100000, 1000000).toString();
  store.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  return code;
}

/**
 * Confere o código. Retorna true e invalida a entrada se corresponder.
 * 5 tentativas erradas ou expiração invalidam a entrada.
 */
export function consumeCode(email: string, code: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(email);
    return false;
  }

  store.delete(email);
  return true;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual verification (temporary script)**

Create a throwaway file `scratch-otp-test.mjs` in the project root:

```js
// scratch-otp-test.mjs — delete after running
import { issueCode, consumeCode } from "./src/lib/auth/otp-store.ts";
```

This won't run directly with plain Node (TS import). Instead verify via a quick inline Node REPL using the compiled logic manually reasoned through, OR skip to Task 8 where this module is exercised end-to-end through the login form. **Delete `scratch-otp-test.mjs` if created — do not commit it.** Mark this step done once you've read through `consumeCode` and confirmed by inspection: right code → true + entry gone; wrong code 5x → entry gone; expired → false + entry gone.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/otp-store.ts
git commit -m "feat: add in-memory OTP store for email login codes"
```

---

### Task 3: Rate limiter (in-memory)

**Files:**
- Create: `src/lib/auth/rate-limit.ts`

**Interfaces:**
- Produces: `isRateLimited(key: string): boolean`

- [ ] **Step 1: Write the file**

```ts
const WINDOW_MS = 60_000;

const lastRequestAt = new Map<string, number>();

/**
 * Retorna true se `key` já fez um pedido nos últimos 60s (não atualiza o
 * timestamp nesse caso — a janela conta a partir do primeiro pedido).
 * Retorna false e registra o pedido caso contrário.
 */
export function isRateLimited(key: string): boolean {
  const last = lastRequestAt.get(key);
  if (last !== undefined && Date.now() - last < WINDOW_MS) return true;

  lastRequestAt.set(key, Date.now());
  return false;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/rate-limit.ts
git commit -m "feat: add in-memory rate limiter for OTP requests"
```

---

### Task 4: Turnstile server-side verification

**Files:**
- Create: `src/lib/auth/turnstile.ts`

**Interfaces:**
- Consumes: env var `TURNSTILE_SECRET_KEY`
- Produces: `verifyTurnstile(token: string, remoteIp?: string): Promise<boolean>`

- [ ] **Step 1: Write the file**

```ts
interface TurnstileVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/** Valida o token do widget Turnstile no servidor (nunca confia no client). */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("TURNSTILE_SECRET_KEY não configurada");
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  if (!res.ok) return false;
  const data = (await res.json()) as TurnstileVerifyResponse;
  return data.success === true;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/turnstile.ts
git commit -m "feat: add server-side Cloudflare Turnstile verification"
```

---

### Task 5: Resend email client

**Files:**
- Create: `src/lib/email/resend.ts`

**Interfaces:**
- Consumes: env vars `RESEND_API_KEY`, `RESEND_FROM`
- Produces: `sendOtpEmail(to: string, code: string): Promise<void>`

- [ ] **Step 1: Write the file**

```ts
import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");
    client = new Resend(apiKey);
  }
  return client;
}

/** Envia o código de 6 dígitos por email. Lança em caso de falha do Resend. */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM não configurada");

  const { error } = await getClient().emails.send({
    from,
    to: [to],
    subject: "Seu código de acesso",
    html: `<p>Seu código de acesso ao Briefing Diário é:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
<p>Expira em 10 minutos. Se você não pediu esse código, ignore este email.</p>`,
  });

  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/resend.ts
git commit -m "feat: add Resend email client for OTP delivery"
```

---

### Task 6: NextAuth config

**Files:**
- Create: `src/auth.ts`

**Interfaces:**
- Consumes: `consumeCode` from `@/lib/auth/otp-store` (Task 2), `SITE` from `@/lib/config`, env var `AUTH_EMAIL`
- Produces: `{ handlers, auth, signIn, signOut }` — used by Task 7 (route), Task 8 (actions), Task 11 (login page), Task 12 (nav), Task 14 (page.tsx)

- [ ] **Step 1: Write the file**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { SITE } from "@/lib/config";
import { consumeCode } from "@/lib/auth/otp-store";

const credentialsSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        code: {},
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, code } = parsed.data;
        const authEmail = process.env.AUTH_EMAIL?.toLowerCase();
        if (!authEmail || email !== authEmail) return null;

        if (!consumeCode(email, code)) return null;

        return { name: SITE.userName, email };
      },
    }),
  ],
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. (If `Credentials` provider's `authorize` param type complains about `raw` being untyped, this is expected — `credentialsSchema.safeParse` accepts `unknown` so no cast is needed.)

- [ ] **Step 3: Commit**

```bash
git add src/auth.ts
git commit -m "feat: add NextAuth v5 config with credentials-based OTP login"
```

---

### Task 7: NextAuth route handler

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Interfaces:**
- Consumes: `handlers` from `@/auth` (Task 6)

- [ ] **Step 1: Write the file**

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Start the dev server and confirm the route responds**

Run: `npm run dev` (leave running), then in another terminal:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/providers
```
Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: wire up NextAuth route handler"
```

---

### Task 8: Login server actions

**Files:**
- Create: `src/app/login/actions.ts`

**Interfaces:**
- Consumes: `signIn` from `@/auth` (Task 6), `issueCode` from `@/lib/auth/otp-store` (Task 2), `isRateLimited` from `@/lib/auth/rate-limit` (Task 3), `verifyTurnstile` from `@/lib/auth/turnstile` (Task 4), `sendOtpEmail` from `@/lib/email/resend` (Task 5)
- Produces: `sendCodeAction(prev: SendCodeState, formData: FormData): Promise<SendCodeState>`, `verifyCodeAction(prev: VerifyCodeState, formData: FormData): Promise<VerifyCodeState>`, types `SendCodeState = { ok: boolean; error?: string }`, `VerifyCodeState = { ok: boolean; error?: string }` — used by Task 10 (`login-form.tsx`)

- [ ] **Step 1: Write the file**

```ts
"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { issueCode } from "@/lib/auth/otp-store";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { sendOtpEmail } from "@/lib/email/resend";

const GENERIC_ERROR = "Não foi possível processar. Tente novamente em instantes.";
const emailSchema = z.string().email();
const codeSchema = z.string().length(6);

export interface SendCodeState {
  ok: boolean;
  error?: string;
}

export async function sendCodeAction(
  _prev: SendCodeState,
  formData: FormData
): Promise<SendCodeState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const token = formData.get("cf-turnstile-response");

  if (!parsedEmail.success || typeof token !== "string" || !token) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const isHuman = await verifyTurnstile(token);
  if (!isHuman) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const email = parsedEmail.data.toLowerCase();

  if (isRateLimited(email)) {
    return { ok: false, error: "Aguarde um pouco antes de pedir um novo código." };
  }

  // Resposta sempre genérica — não revela se o email é ou não autorizado.
  const authEmail = process.env.AUTH_EMAIL?.toLowerCase();
  if (email === authEmail) {
    const code = issueCode(email);
    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("[auth] falha ao enviar código:", err);
    }
  }

  return { ok: true };
}

export interface VerifyCodeState {
  ok: boolean;
  error?: string;
}

export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const parsedCode = codeSchema.safeParse(formData.get("code"));

  if (!parsedEmail.success || !parsedCode.success) {
    return { ok: false, error: GENERIC_ERROR };
  }

  try {
    await signIn("credentials", {
      email: parsedEmail.data.toLowerCase(),
      code: parsedCode.data,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Código inválido ou expirado." };
    }
    throw err;
  }

  redirect("/");
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/actions.ts
git commit -m "feat: add sendCodeAction and verifyCodeAction server actions"
```

---

### Task 9: Turnstile widget component

**Files:**
- Create: `src/components/turnstile-widget.tsx`

**Interfaces:**
- Produces: `<TurnstileWidget siteKey={string} />` — used by Task 10

- [ ] **Step 1: Write the file**

```tsx
"use client";

import Script from "next/script";

interface TurnstileWidgetProps {
  siteKey: string;
}

/**
 * Renderização implícita: o script da Cloudflare escaneia o DOM por
 * `.cf-turnstile` e injeta o widget + input hidden `cf-turnstile-response`
 * dentro do form mais próximo automaticamente.
 */
export function TurnstileWidget({ siteKey }: TurnstileWidgetProps) {
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/turnstile-widget.tsx
git commit -m "feat: add Cloudflare Turnstile widget component"
```

---

### Task 10: Login form (2-step client component)

**Files:**
- Create: `src/components/login-form.tsx`

**Interfaces:**
- Consumes: `sendCodeAction`, `verifyCodeAction`, `SendCodeState`, `VerifyCodeState` from `@/app/login/actions` (Task 8), `TurnstileWidget` from `@/components/turnstile-widget` (Task 9)
- Produces: `<LoginForm turnstileSiteKey={string} />` — used by Task 11

- [ ] **Step 1: Write the file**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/login-form.tsx
git commit -m "feat: add 2-step login form component"
```

---

### Task 11: Login page

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth` (Task 6), `LoginForm` from `@/components/login-form` (Task 10), env var `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

- [ ] **Step 1: Write the file**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY não configurada");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-5 py-20">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-1 text-sm text-secondary">
          Acesso restrito. Informe seu email para receber um código.
        </p>
      </div>
      <LoginForm turnstileSiteKey={siteKey} />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add /login page"
```

---

### Task 12: Nav (login link / name + logout)

**Files:**
- Create: `src/components/nav.tsx`

**Interfaces:**
- Consumes: `auth`, `signOut` from `@/auth` (Task 6)
- Produces: `<Nav />` (async Server Component) — used by Task 14

- [ ] **Step 1: Write the file**

```tsx
import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Nav() {
  const session = await auth();

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-3 text-sm">
      {session?.user ? (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="flex items-center gap-3"
        >
          <span className="text-secondary">{session.user.name}</span>
          <button
            type="submit"
            className="rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary transition-colors hover:text-foreground"
          >
            Sair
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-card-border bg-surface px-3.5 py-1.5 text-xs text-secondary transition-colors hover:text-foreground"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: add Nav component with login link and logout"
```

---

### Task 13: Generic greeting (no name when logged out)

**Files:**
- Modify: `src/lib/date.ts:42-47`

**Interfaces:**
- Produces: `greeting(name?: string, tz?: string): string` (was `greeting(name: string, tz?: string): string`) — consumed by Task 14

- [ ] **Step 1: Update `greeting()`**

Replace:

```ts
export function greeting(name: string, tz = SITE.timezone): string {
  const h = currentHour(tz);
  if (h >= 5 && h < 12) return `Bom dia, ${name}`;
  if (h >= 12 && h < 18) return `Boa tarde, ${name}`;
  return `Boa noite, ${name}`;
}
```

With:

```ts
export function greeting(name?: string, tz = SITE.timezone): string {
  const h = currentHour(tz);
  const base = h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${base}, ${name}` : base;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors (the one existing caller in `src/app/page.tsx` still passes a string, which remains valid since the param is now optional).

- [ ] **Step 3: Commit**

```bash
git add src/lib/date.ts
git commit -m "feat: make greeting() name optional for logged-out users"
```

---

### Task 14: Wire auth into the homepage

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth` (Task 6), `Nav` from `@/components/nav` (Task 12), updated `greeting` from `@/lib/date` (Task 13)

- [ ] **Step 1: Update imports**

At the top of `src/app/page.tsx`, add:

```ts
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
```

- [ ] **Step 2: Add `Nav` to the empty-state branch**

Change:

```tsx
  if (!briefing) {
    return (
      <>
        <ScrollProgress />
        <EmptyState />
      </>
    );
  }
```

To:

```tsx
  if (!briefing) {
    return (
      <>
        <ScrollProgress />
        <Nav />
        <EmptyState />
      </>
    );
  }
```

- [ ] **Step 3: Fetch session alongside the briefing**

Change:

```tsx
export default async function Page() {
  const briefing = await getLatestBriefing();
```

To:

```tsx
export default async function Page() {
  const [briefing, session] = await Promise.all([getLatestBriefing(), auth()]);
  const isAuthenticated = Boolean(session?.user);
```

- [ ] **Step 4: Pass session-aware greeting, add `Nav`, gate `AgendaSection`**

Change:

```tsx
      <Hero
        greeting={greeting(SITE.userName)}
        dateLabel={formatFullDate()}
        updatedTime={formatTime(briefing.generatedAt)}
        temperature={weather?.temperature ?? null}
        weatherDescription={weather?.description ?? null}
        summary={heroSummary}
      />

      <main>
        <WeatherSection weather={weather} aiSummary={ai?.weatherSummary} />

        {ai?.dailyQuote.text && (
          <QuoteSection text={ai.dailyQuote.text} author={ai.dailyQuote.author} />
        )}

        <AgendaSection events={agenda} aiSummary={ai?.agendaSummary} />
```

To:

```tsx
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

        {ai?.dailyQuote.text && (
          <QuoteSection text={ai.dailyQuote.text} author={ai.dailyQuote.author} />
        )}

        {isAuthenticated && (
          <AgendaSection events={agenda} aiSummary={ai?.agendaSummary} />
        )}
```

- [ ] **Step 5: Remove the now-unused `SITE` import if nothing else in the file uses it**

Run: `grep -n "SITE" src/app/page.tsx`
If `SITE` only appears in the `import { CATEGORIES, SITE } from "@/lib/config";` line, change it to `import { CATEGORIES } from "@/lib/config";`. If `SITE` is still used elsewhere in the file, leave the import as-is.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: gate agenda section and personalize greeting behind auth"
```

---

### Task 15: End-to-end manual verification

**Files:** none (verification only)

No new code. Run through every scenario from the spec's "Testes manuais" section against a local dev server with real `AUTH_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM`, `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` (Cloudflare's [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) work for local testing without a real domain), and `AUTH_SECRET` set in `.env`.

- [ ] **Step 1: Start the app**

```bash
npm run dev
```

- [ ] **Step 2: Logged-out homepage**

Visit `http://localhost:3000/`. Expected: news sections visible, no agenda section, generic greeting ("Bom dia"/"Boa tarde"/"Boa noite" with no name), "Entrar" link visible top-right.

- [ ] **Step 3: Login with correct email**

Visit `/login`, submit `AUTH_EMAIL`. Expected: form advances to code step, email arrives via Resend with a 6-digit code within ~1 minute.

- [ ] **Step 4: Login with wrong email**

Submit a different email. Expected: same generic "advance to code step" UX (per spec, no enumeration signal) but no email is actually sent — confirm nothing arrives in your inbox for that address.

- [ ] **Step 5: Wrong code then correct code**

On the code step (for the real `AUTH_EMAIL` flow from Step 3), submit 3 wrong codes, then the real one. Expected: 4th attempt (the correct one) succeeds, redirects to `/`.

- [ ] **Step 6: 5 wrong codes**

Request a fresh code, submit 5 wrong codes. Expected: 6th attempt — even with the *correct* code — fails (entry was invalidated at attempt 5). Must request a new code to proceed.

- [ ] **Step 7: Expired code**

Requires patience or temporarily lowering `OTP_TTL_MS` in `src/lib/auth/otp-store.ts` to `10_000` (10s) for this test only, then reverting. Request a code, wait past expiry, submit it. Expected: rejected with generic error.

- [ ] **Step 8: Rate limit**

Request a code, immediately request another (within 60s) for the same email. Expected: second request rejected with the "aguarde" message.

- [ ] **Step 9: Logged-in homepage**

After a successful login (Step 5), visit `/`. Expected: agenda section visible, greeting includes the name (`SITE.userName`), nav shows name + "Sair".

- [ ] **Step 10: Logout**

Click "Sair". Expected: redirected to `/`, back to logged-out state (Step 2 behavior).

- [ ] **Step 11: `/login` while already authenticated**

While logged in, visit `/login` directly. Expected: immediate redirect to `/`.

- [ ] **Step 12: Confirm no unrelated regressions**

```bash
npm run build
```
Expected: build succeeds with no new errors or warnings beyond what existed before this feature (the app's existing `xml2js`/`sax` dev-mode warnings, if any, are unrelated and pre-existing).

- [ ] **Step 13: Final commit (if Step 7's temporary TTL change wasn't reverted in git)**

```bash
git status
```
Expected: clean — `src/lib/auth/otp-store.ts` should show `OTP_TTL_MS = 10 * 60_000`, not the 10-second test value. If dirty, revert it:
```bash
git checkout src/lib/auth/otp-store.ts
```
