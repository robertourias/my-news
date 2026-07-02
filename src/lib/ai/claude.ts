import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIRequest } from "./provider";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY não configurada");
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  }

  async complete({ system, user }: AIRequest): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      // prompt caching: o system prompt fixo é cacheado entre execuções
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: user },
        // prefill força a resposta a começar como JSON
        { role: "assistant", content: "{" },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return `{${text}`;
  }
}
