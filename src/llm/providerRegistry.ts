import type { ChunkWindow, ExtractionTask } from "../types.js";
import { LocalOpenAiProvider } from "./localOpenAiProvider.js";
import { MockProvider } from "./mockProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";

// Provider-neutral LLM task interface (planning: "Local and cloud LLM execution").
// M1 supports the `skeleton_slot_extraction` task kind only.

export interface LlmProvider {
  readonly name: string;
  /**
   * Answer one slot extraction task for one chunk. `retryPrompt` is set on the
   * second attempt after invalid JSON. Returns the raw model text.
   */
  extract(
    task: ExtractionTask,
    chunk: ChunkWindow,
    retryPrompt?: string,
  ): Promise<string>;
}

export interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export function resolveProvider(name: string, config: ProviderConfig): LlmProvider {
  switch (name) {
    case "local":
      return new LocalOpenAiProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`unknown llm provider: ${name} (supported: local, ollama, mock)`);
  }
}
