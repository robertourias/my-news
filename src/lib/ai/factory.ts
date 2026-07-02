import type { AIProvider } from "./provider";
import { ClaudeProvider } from "./claude";

let instance: AIProvider | null = null;

/**
 * Seleção do provedor via env AI_PROVIDER.
 * Para adicionar OpenAI/Gemini/Ollama: implemente AIProvider e registre aqui.
 */
export function getAIProvider(): AIProvider {
  if (instance) return instance;

  const provider = (process.env.AI_PROVIDER || "claude").toLowerCase();
  switch (provider) {
    case "claude":
      instance = new ClaudeProvider();
      return instance;
    case "openai":
    case "gemini":
    case "ollama":
      throw new Error(
        `Provedor "${provider}" ainda não implementado. Implemente AIProvider em src/lib/ai/ e registre no factory.`
      );
    default:
      throw new Error(`AI_PROVIDER desconhecido: ${provider}`);
  }
}
