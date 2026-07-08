import { M1_DEFAULTS } from "../config.js";
import type { ChunkWindow, ExtractionTask } from "../types.js";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder.js";
import type { LlmProvider, ProviderConfig } from "./providerRegistry.js";

// Generic OpenAI-compatible chat completions client (spec §2.3).
// Covers Ollama (`http://localhost:11434/v1`) and LM Studio.

export class LocalOpenAiProvider implements LlmProvider {
  readonly name = "local";
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = (config.baseUrl || M1_DEFAULTS.llm_base_url).replace(/\/$/, "");
    this.model = config.model || M1_DEFAULTS.llm_model;
    this.apiKey = config.apiKey;
  }

  async extract(
    task: ExtractionTask,
    chunk: ChunkWindow,
    retryPrompt?: string,
  ): Promise<string> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: retryPrompt ?? buildUserPrompt(task, chunk) },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `llm endpoint ${this.baseUrl} returned ${response.status}: ${body.slice(0, 300)}`,
      );
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error(`llm endpoint ${this.baseUrl} returned no message content`);
    }
    return content;
  }
}
