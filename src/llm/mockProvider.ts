import type { ChunkWindow, ExtractionTask } from "../types.js";
import type { LlmProvider } from "./providerRegistry.js";

// Deterministic offline provider for tests and dry runs (spec §2.3, §11).
// Picks real lines from the chunk so offset resolution, dedup, clustering,
// and threshold filtering are all exercised without a model.

function candidateLines(chunk: ChunkWindow): string[] {
  return chunk.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 40 && l.length <= 400);
}

export class MockProvider implements LlmProvider {
  readonly name = "mock";

  async extract(task: ExtractionTask, chunk: ChunkWindow): Promise<string> {
    const lines = candidateLines(chunk);
    const matches: Record<string, unknown>[] = [];

    task.slots.forEach((slot, i) => {
      const line = lines[(chunk.index + i * 2) % Math.max(1, lines.length)];
      if (!line || lines.length === 0) return;
      // one deliberately low-confidence match per task to exercise filtering
      const lowConfidence = i === task.slots.length - 1 && chunk.index % 2 === 1;
      matches.push({
        slot: slot.slot,
        mapped_slot: slot.mapped_slot,
        span_text: line,
        confidence: lowConfidence ? 0.2 : 0.6 + 0.1 * (i % 4),
        match_class: lowConfidence ? "uncertain" : i % 3 === 2 ? "partial" : "compatible",
        reason: `mock: deterministic pick for ${slot.mapped_slot}`,
      });
    });

    return JSON.stringify({ matches, warnings: [] });
  }
}
