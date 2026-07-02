# Login com NextAuth (Auth.js v5) + código por e-mail

Data: 2026-07-02

## Objetivo

Adicionar autenticação ao briefing diário. Deslogado, o site continua público
mostrando as notícias. Logado, o usuário passa a ver também a agenda e é
recebido pelo nome. Login é passwordless: e-mail fixo (allowlist de 1) +
código de 6 dígitos enviado por e-mail, protegido por Cloudflare Turnstile
contra bots.

## Não-objetivos

- Multi-usuário / cadastro. Só o email definido em `AUTH_EMAIL` pode logar.
- Banco de dados. Sessão é JWT; código OTP fica em memória do processo.
- OAuth social (Google, GitHub, etc).
- "Lembrar dispositivo" / MFA adicional além do código por e-mail.

## Arquitetura

- **Auth.js v5** (`next-auth@5`, App Router nativo) com **Credentials
  provider** customizado. Sessão **JWT**, sem adapter de banco — cookie
  assinado por `NEXTAUTH_SECRET`.
- Código de 6 dígitos gerado com `crypto.randomInt(100000, 999999)`, guardado
  em `Map` em memória no processo do servidor (app roda em container único,
  long-running — não serverless/edge), com expiração de 10 minutos.
- Envio do código via **Resend**.
- **Cloudflare Turnstile** validado *server-side* no endpoint que gera o
  código — nunca confia em validação client-side.
- Único email aceito: `AUTH_EMAIL` (env var). Qualquer outro email retorna
  erro genérico, sem revelar que é allowlist de um único endereço.

## Fluxo de login

1. `/login`, passo 1: campo de email + widget Turnstile invisível.
2. Submit → `POST /api/auth/send-code`:
   - Valida token Turnstile via `siteverify`.
   - Confere `email === AUTH_EMAIL`.
   - Rate limit: 1 pedido por 60s.
   - Gera código, salva no Map (`{ code, expiresAt, attempts: 0 }`), envia
     por Resend.
   - Resposta sempre genérica ("se o email for válido, você recebe um
     código") — não revela se o email é ou não o autorizado.
3. UI avança pro passo 2: campo de código (6 dígitos).
4. Submit → `signIn("credentials", { email, code })`.
5. `authorize()` do Credentials provider:
   - Busca entrada no Map pelo email.
   - Expirada ou inexistente → erro.
   - Código errado → incrementa `attempts`; 5 erros → invalida a entrada
     (força pedir código novo).
   - Código certo → apaga a entrada (uso único), retorna
     `{ name: SITE.userName, email }`.
6. NextAuth emite cookie de sessão JWT (`httpOnly`, `secure` em produção,
   `sameSite: lax`).
7. Todas as mensagens de erro do fluxo (Turnstile falhou, código errado,
   código expirado, muitas tentativas) são a mesma mensagem genérica pro
   usuário final — só o log do servidor diferencia a causa.

## Visibilidade condicional

Sem middleware bloqueando rota — a home (`/`) continua pública e renderiza
sempre. Em `src/app/page.tsx` (Server Component), chama-se `auth()`:

- **Deslogado**: saudação genérica no Hero (sem nome), `AgendaSection` não é
  renderizada, resto do briefing (clima, notícias, insights) normal.
- **Logado**: saudação com nome (vindo de `session.user.name`),
  `AgendaSection` renderizada normalmente.
- Nav no topo da página: "Entrar" (deslogado) ou "{nome} · Sair" (logado).

## Novos arquivos

```
src/auth.ts                                # config NextAuth: providers, callbacks JWT/session
src/app/api/auth/[...nextauth]/route.ts    # handlers GET/POST do NextAuth
src/app/api/auth/send-code/route.ts        # gera + envia código (valida Turnstile aqui)
src/lib/auth/otp-store.ts                  # Map em memória: email -> {code, expiresAt, attempts}
src/lib/auth/rate-limit.ts                 # Map em memória: email -> timestamp do último pedido
src/lib/email/resend.ts                    # client Resend + template do e-mail com o código
src/app/login/page.tsx                     # form 2 passos (Client Component)
src/components/nav.tsx                     # barra topo: Entrar / Nome + Sair
```

## Storage do código (`otp-store.ts`)

```ts
Map<string, { code: string; expiresAt: number; attempts: number }>
```

- `expiresAt` = `Date.now() + 10 * 60_000`.
- Leitura remove entrada expirada antes de comparar (limpeza lazy, sem cron
  dedicado).
- 5 tentativas erradas invalida a entrada.

## Rate limit (`rate-limit.ts`)

- `Map<string, number>` (email → timestamp do último pedido).
- Pedido antes de 60s do anterior → erro "aguarde alguns segundos" (mensagem
  genérica, não expõe o tempo exato restante, tempo restante só logado no
  servidor).

## Segurança

- Turnstile: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
  com `TURNSTILE_SECRET_KEY`, valida `success: true` antes de gerar código.
- Código: `crypto.randomInt`, nunca `Math.random`.
- Nenhuma resposta de erro do fluxo de login distingue "email não
  autorizado" de "email autorizado mas código errado/expirado" — mitiga
  enumeration.
- Cookie de sessão: `httpOnly`, `secure` (HTTPS via Traefik em produção),
  `sameSite: lax`.
- `AUTH_EMAIL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`
  nunca expostos ao client (só em rotas de API / server components).

## Env vars novas (`.env.example`)

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://briefing.nico.dev.br
AUTH_EMAIL=seu-email@gmail.com
RESEND_API_KEY=
RESEND_FROM=briefing@seu-dominio.com
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

## Dependências novas

- `next-auth@beta` (Auth.js v5)
- `resend`
- Turnstile: widget carregado via `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">`
  no client, sem lib npm extra.

## Erros e casos de borda

| Caso | Comportamento |
|---|---|
| Email diferente de `AUTH_EMAIL` | Resposta genérica de sucesso (não revela allowlist); nenhum e-mail é enviado |
| Turnstile falha | Erro genérico "não foi possível verificar, tente novamente" |
| Pedido de código repetido < 60s | Erro genérico de "aguarde" |
| Código expirado (>10min) | Erro genérico; usuário precisa pedir novo código (volta ao passo 1) |
| Código errado 5x | Entrada invalidada; mesma UX de expirado |
| Resend falha ao enviar | Erro genérico; log detalhado no servidor |
| Restart do processo (container) | Map em memória zera — pedidos de código pendentes são perdidos, usuário só precisa pedir de novo |

## Testes manuais (sem infra de teste automatizado no projeto hoje)

1. Login com `AUTH_EMAIL` correto + Turnstile ok + código certo → sessão
   criada, nome aparece, agenda aparece.
2. Login com email diferente → resposta genérica, nenhum e-mail chega.
3. Código errado 3x → ainda aceita a 4ª tentativa certa; 5 erradas → bloqueia.
4. Esperar 11 minutos e tentar código antigo → rejeitado.
5. Pedir 2 códigos em <60s → segundo pedido rejeitado com "aguarde".
6. Deslogado: `/` mostra notícias, sem agenda, saudação genérica.
7. Logado: `/` mostra agenda, saudação com nome.
8. Logout: sessão encerra, `/` volta ao estado deslogado.
