import type { ChunkWindow, ExtractionTask } from "../types.js";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder.js";
import type { LlmProvider, ProviderConfig } from "./providerRegistry.js";

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "qwen3:4b";

// Native Ollama chat client. This avoids requiring Ollama's OpenAI-compatible
// /v1 endpoint and uses JSON mode to improve structured extraction stability.

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama";
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = normalizeOllamaBaseUrl(config.baseUrl || DEFAULT_OLLAMA_BASE_URL);
    this.model = config.model || DEFAULT_OLLAMA_MODEL;
  }

  async extract(
    task: ExtractionTask,
    chunk: ChunkWindow,
    retryPrompt?: string,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: "json",
        options: {
          temperature: 0,
        },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: retryPrompt ?? buildUserPrompt(task, chunk) },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `ollama endpoint ${this.baseUrl} returned ${response.status}: ${body.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as {
      message?: { content?: string };
      error?: string;
    };
    if (payload.error) {
      throw new Error(`ollama endpoint ${this.baseUrl} returned error: ${payload.error}`);
    }
    const content = payload.message?.content;
    if (typeof content !== "string") {
      throw new Error(`ollama endpoint ${this.baseUrl} returned no message content`);
    }
    return content;
  }
}

function normalizeOllamaBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed;
}
