/**
 * Scheduler interno: gera o briefing diariamente (CRON_SCHEDULE, padrão 06:00)
 * e, opcionalmente, na inicialização caso o briefing do dia não exista.
 * Roda apenas no runtime Node.js do servidor.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation.node");
    await registerNode();
  }
}
