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
