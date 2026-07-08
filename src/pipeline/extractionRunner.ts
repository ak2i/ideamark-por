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
// chunk, guard outputs (one retry on invalid JSON), persist raw LLM responses
// per chunk, and resolve chunk-relative offsets into source-unit offsets.

export interface ExtractionStats {
  chunk_count: number;
  task_count: number;
  call_count: number;
  retry_count: number;
  failed_calls: number;
  raw_match_count: number;
  matched_task_count: number;
  no_hit_task_count: number;
  matched_chunk_count: number;
  no_hit_chunk_count: number;
  schema_error_count: number;
  retry_success_count: number;
  retry_failed_count: number;
  anchoring_warning_count: number;
}

export interface ExtractionOutput {
  results: SlotExtractionResult[];
  resolved: ResolvedMatch[];
  stats: ExtractionStats;
}

interface RawAttemptRecord {
  provider: string;
  task_id: string;
  source_id: string;
  chunk_id: string;
  projection_id: string;
  family_id: string;
  attempt: number;
  prompt: string;
  raw_text: string | null;
  guard: {
    ok: boolean;
    error?: string;
  };
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
    matched_task_count: 0,
    no_hit_task_count: 0,
    matched_chunk_count: 0,
    no_hit_chunk_count: 0,
    schema_error_count: 0,
    retry_success_count: 0,
    retry_failed_count: 0,
    anchoring_warning_count: 0,
  };

  for (const chunk of chunks) {
    const chunkResults: SlotExtractionResult[] = [];
    const rawAttempts: RawAttemptRecord[] = [];
    for (const task of tasks) {
      stats.call_count += 1;
      let result: SlotExtractionResult | null = null;
      try {
        const prompt = buildUserPrompt(task, chunk);
        const rawText = await provider.extract(task, chunk);
        try {
          result = guardLlmOutput(rawText, task, chunk);
          rawAttempts.push(rawAttempt(provider, task, chunk, 1, prompt, rawText, true));
        } catch (guardErr) {
          stats.schema_error_count += 1;
          rawAttempts.push(
            rawAttempt(provider, task, chunk, 1, prompt, rawText, false, guardErr),
          );
          // one corrective retry, then degrade to zero matches (spec §7)
          stats.retry_count += 1;
          const retryPrompt = prompt + RETRY_SUFFIX;
          const retryText = await provider.extract(task, chunk, retryPrompt);
          try {
            result = guardLlmOutput(retryText, task, chunk);
            stats.retry_success_count += 1;
            rawAttempts.push(
              rawAttempt(provider, task, chunk, 2, retryPrompt, retryText, true),
            );
          } catch (retryGuardErr) {
            stats.schema_error_count += 1;
            stats.retry_failed_count += 1;
            rawAttempts.push(
              rawAttempt(
                provider,
                task,
                chunk,
                2,
                retryPrompt,
                retryText,
                false,
                retryGuardErr,
              ),
            );
            throw retryGuardErr;
          }
        }
      } catch (err) {
        stats.failed_calls += 1;
        if (!rawAttempts.some((r) => r.task_id === task.task_id && r.attempt >= 1)) {
          rawAttempts.push(
            rawAttempt(provider, task, chunk, 1, buildUserPrompt(task, chunk), null, false, err),
          );
        }
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
      if (result.matches.length > 0) {
        stats.matched_task_count += 1;
      } else if (!result.warnings.some((w) => w.code === "extraction_failed")) {
        stats.no_hit_task_count += 1;
      }
      stats.anchoring_warning_count += result.warnings.filter(
        (w) => w.code === "span_not_in_chunk",
      ).length;
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
    const chunkMatchCount = chunkResults.reduce((n, r) => n + r.matches.length, 0);
    if (chunkMatchCount > 0) {
      stats.matched_chunk_count += 1;
    } else if (!chunkResults.some((r) => r.warnings.some((w) => w.code === "extraction_failed"))) {
      stats.no_hit_chunk_count += 1;
    }
    session.writeRawResponses(chunk.chunk_id, rawAttempts);
    session.writeMatches(chunk.chunk_id, chunkResults);
    log(
      `chunk ${chunk.index + 1}/${chunks.length} (${chunk.chunk_id}): ${chunkMatchCount} matches`,
    );
  }

  return { results, resolved, stats };
}

function rawAttempt(
  provider: LlmProvider,
  task: ExtractionTask,
  chunk: ChunkWindow,
  attempt: number,
  prompt: string,
  rawText: string | null,
  ok: boolean,
  err?: unknown,
): RawAttemptRecord {
  return {
    provider: provider.name,
    task_id: task.task_id,
    source_id: chunk.source_id,
    chunk_id: chunk.chunk_id,
    projection_id: task.projection_id,
    family_id: task.family_id,
    attempt,
    prompt,
    raw_text: rawText,
    guard: ok
      ? { ok: true }
      : {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
  };
}
