import { buildUserPrompt, RETRY_SUFFIX } from "../llm/promptBuilder.js";
import { guardLlmOutput } from "../llm/outputGuard.js";
import type { LlmProvider } from "../llm/providerRegistry.js";
import type { SessionStore } from "../session/sessionStore.js";
import type {
  ChunkWindow,
  ExtractionTask,
  ResolvedMatch,
  SlotExtractionResult,
} from "../types.js";

// slot_match_store + extraction loop (spec §7): run every task against every
// chunk, guard outputs (one retry on invalid JSON), persist raw results per
// chunk, and resolve chunk-relative offsets into source-unit offsets.

export interface ExtractionStats {
  chunk_count: number;
  task_count: number;
  call_count: number;
  retry_count: number;
  failed_calls: number;
  raw_match_count: number;
}

export interface ExtractionOutput {
  results: SlotExtractionResult[];
  resolved: ResolvedMatch[];
  stats: ExtractionStats;
}

export async function runExtraction(
  provider: LlmProvider,
  tasks: ExtractionTask[],
  chunks: ChunkWindow[],
  session: SessionStore,
  log: (line: string) => void,
): Promise<ExtractionOutput> {
  const results: SlotExtractionResult[] = [];
  const resolved: ResolvedMatch[] = [];
  const stats: ExtractionStats = {
    chunk_count: chunks.length,
    task_count: tasks.length,
    call_count: 0,
    retry_count: 0,
    failed_calls: 0,
    raw_match_count: 0,
  };

  for (const chunk of chunks) {
    const chunkResults: SlotExtractionResult[] = [];
    for (const task of tasks) {
      stats.call_count += 1;
      let result: SlotExtractionResult | null = null;
      try {
        const rawText = await provider.extract(task, chunk);
        try {
          result = guardLlmOutput(rawText, task, chunk);
        } catch {
          // one corrective retry, then degrade to zero matches (spec §7)
          stats.retry_count += 1;
          const retryText = await provider.extract(
            task,
            chunk,
            buildUserPrompt(task, chunk) + RETRY_SUFFIX,
          );
          result = guardLlmOutput(retryText, task, chunk);
        }
      } catch (err) {
        stats.failed_calls += 1;
        result = {
          task_id: task.task_id,
          source_id: chunk.source_id,
          chunk_id: chunk.chunk_id,
          projection_id: task.projection_id,
          family_id: task.family_id,
          matches: [],
          warnings: [
            {
              code: "extraction_failed",
              message: err instanceof Error ? err.message : String(err),
            },
          ],
        };
      }

      stats.raw_match_count += result.matches.length;
      chunkResults.push(result);
      results.push(result);

      for (const match of result.matches) {
        resolved.push({
          ...match,
          task_id: task.task_id,
          source_id: chunk.source_id,
          source_unit_id: chunk.source_unit_id,
          chunk_id: chunk.chunk_id,
          projection_id: task.projection_id,
          family_id: task.family_id,
          unit_start:
            match.start_offset === null ? null : chunk.start_offset + match.start_offset,
          unit_end:
            match.end_offset === null ? null : chunk.start_offset + match.end_offset,
          support: 1,
        });
      }
    }
    session.writeMatches(chunk.chunk_id, chunkResults);
    log(
      `chunk ${chunk.index + 1}/${chunks.length} (${chunk.chunk_id}): ${chunkResults.reduce((n, r) => n + r.matches.length, 0)} matches`,
    );
  }

  return { results, resolved, stats };
}
