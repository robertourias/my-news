import type { Briefing } from "../types";

/**
 * Abstração de persistência (Future Ready).
 * Implementação atual: arquivos JSON em volume. Para múltiplos usuários,
 * troque por uma implementação com banco (Postgres etc.) sem alterar
 * a lógica de negócio.
 */
export interface StorageProvider {
  getLatest(): Promise<Briefing | null>;
  getByDate(date: string): Promise<Briefing | null>;
  save(briefing: Briefing): Promise<void>;
}
