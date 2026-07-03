const WINDOW_MS = 60_000;

// Faz uma varredura completa a cada N chamadas, removendo todas as entradas
// expiradas — não só a da chave atual. Isso é o que impede o crescimento
// ilimitado do Map quando um atacante envia um fluxo de chaves (emails)
// distintas que nunca se repetem: sem essa varredura periódica, cada chave
// nova ficaria presa no Map para sempre, já que só é "tocada" uma vez.
const SWEEP_INTERVAL = 100;

const lastRequestAt = new Map<string, number>();

let callsSinceSweep = 0;

function sweepExpiredEntries(): void {
  const now = Date.now();
  for (const [entryKey, timestamp] of lastRequestAt) {
    if (now - timestamp >= WINDOW_MS) {
      lastRequestAt.delete(entryKey);
    }
  }
}

/**
 * Retorna true se `key` já fez um pedido nos últimos 60s (não atualiza o
 * timestamp nesse caso — a janela conta a partir do primeiro pedido).
 * Retorna false e registra o pedido caso contrário.
 */
export function isRateLimited(key: string): boolean {
  const last = lastRequestAt.get(key);
  if (last !== undefined && Date.now() - last < WINDOW_MS) return true;

  // A entrada dessa chave (se existir) já expirou — descarta antes de
  // regravar, mantendo o Map livre de lixo por chave individual.
  if (last !== undefined) lastRequestAt.delete(key);

  lastRequestAt.set(key, Date.now());

  // Varredura periódica: garante que entradas de OUTRAS chaves (que nunca
  // mais são consultadas, como em um ataque de enumeração com emails
  // distintos) também sejam removidas, limitando o tamanho do Map a um
  // conjunto de trabalho delimitado (aprox. requisições por janela de 60s).
  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_INTERVAL) {
    callsSinceSweep = 0;
    sweepExpiredEntries();
  }

  return false;
}
