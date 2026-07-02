# Briefing Diário

Página de leitura contínua com resumo diário de notícias, clima, agenda e insights — gerada por IA em **uma única chamada diária** ao Claude, com UI premium (dark mode, glassmorphism, Framer Motion).

## Arquitetura

```
RSS/APIs → Parser → Normalizador → Deduplicação → Agrupamento
        → PromptBuilder (1 prompt compacto) → Claude (1 chamada/dia)
        → JSON validado (zod) → Persistência (JSON em volume) → Next.js
```

Economia de tokens e custos: máx. 25 notícias/execução, resumos de até 300 caracteres sem HTML, system prompt fixo em `prompts/system-prompt.md` com prompt caching, e cache por hash SHA-256 — se o conteúdo agregado do dia não mudou, a IA não é chamada.

Future ready: `AIProvider` (`src/lib/ai/provider.ts`) e `StorageProvider` (`src/lib/storage/storage.ts`) são interfaces — trocar Claude por OpenAI/Gemini/Ollama ou JSON por Postgres não altera a lógica de negócio.

## Desenvolvimento local

```bash
cp .env.example .env   # preencha ANTHROPIC_API_KEY etc.
npm install
npm run dev
```

O briefing é gerado ~3s após o boot (`AUTO_GENERATE_ON_BOOT=true`) e diariamente às 06:00 (`CRON_SCHEDULE`). Geração manual:

```bash
curl -X POST "http://localhost:3000/api/refresh?token=SEU_CRON_SECRET"
# force=1 ignora o cache por hash:
curl -X POST "http://localhost:3000/api/refresh?token=SEU_CRON_SECRET&force=1"
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | sim | Chave da API da Anthropic (console.anthropic.com) |
| `ANTHROPIC_MODEL` | não | Padrão: `claude-sonnet-5` |
| `AI_PROVIDER` | não | `claude` (padrão). Interface pronta para outros provedores |
| `USER_NAME` | não | Nome exibido no Hero (padrão: Roberto) |
| `TZ` | não | Fuso (padrão: `America/Sao_Paulo`) |
| `CALENDAR_ICS_URL` | não | URL secreta iCal do Google Calendar (Configurações do calendário → "Endereço secreto no formato iCal") |
| `CRON_SCHEDULE` | não | Cron da geração diária (padrão: `0 6 * * *`) |
| `AUTO_GENERATE_ON_BOOT` | não | Gera no boot se não houver briefing do dia (padrão: `true`) |
| `CRON_SECRET` | recomendada | Protege `POST /api/refresh` |
| `DATA_DIR` | não | Diretório dos JSONs (no Docker: `/app/data`, volume) |
| `DOMAIN` | deploy | Domínio público roteado pelo Traefik da VPS |

## Docker

- `docker-compose.yml` — desenvolvimento local (porta `3030`, sem Traefik)
- `docker-compose.prod.yml` — produção: apenas o serviço `app` com labels para o **Traefik já existente na VPS** (entrypoint `websecure`, certresolver `letsencrypt`, mesmo padrão dos outros projetos)

```bash
# local
docker compose up -d --build          # http://localhost:3030
```

## Deploy na VPS

Pré-requisito: registro DNS `A` do subdomínio (ex.: `briefing.nico.dev.br`) apontando para a VPS.

```bash
# 1. Envie o projeto (git clone ou rsync)
git clone <seu-repo> briefing && cd briefing

# 2. Configure as envs
cp .env.example .env
nano .env   # ANTHROPIC_API_KEY, DOMAIN, CRON_SECRET, CALENDAR_ICS_URL

# 3. Suba com o compose de produção
docker compose -f docker-compose.prod.yml up -d --build

# 4. Acompanhe
docker compose -f docker-compose.prod.yml logs -f app
```

O Traefik da VPS detecta o container pelas labels e emite o certificado. Se o seu Traefik estiver em uma rede Docker externa dedicada (ex.: `traefik`/`web`), descomente o bloco `networks` no `docker-compose.prod.yml` — confira com `docker inspect <container-traefik> --format '{{json .NetworkSettings.Networks}}'`.

Operação:

```bash
docker compose -f docker-compose.prod.yml logs -f app     # logs
docker compose -f docker-compose.prod.yml up -d --build   # atualizar
docker compose -f docker-compose.prod.yml down            # parar (volume briefing_data preservado)
curl -X POST "https://SEU_DOMINIO/api/refresh?token=SEU_CRON_SECRET"  # regenerar
```

## Feeds

Configurados em `src/lib/config.ts` (`FEEDS`): G1 São Paulo, Google News (Taboão da Serra, IA, Tênis), Hacker News e DEV Community. Edite livremente — o pipeline normaliza, deduplica e limita automaticamente.
