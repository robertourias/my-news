/**
 * Abstração de provedor de IA (Future Ready).
 *
 * A troca de provedor (Claude, OpenAI, Gemini, Ollama...) ocorre apenas
 * implementando esta interface e registrando no factory — a lógica de
 * negócio (pipeline, PromptBuilder, validação, persistência) não muda.
 */
export interface AIRequest {
  /** Instruções fixas (carregadas de prompts/system-prompt.md, nunca reconstruídas) */
  system: string;
  /** Dados variáveis do dia, já compactados pelo PromptBuilder */
  user: string;
}

export interface AIProvider {
  readonly name: string;
  /** Retorna o texto bruto da resposta (esperado: JSON minificado) */
  complete(request: AIRequest): Promise<string>;
}
