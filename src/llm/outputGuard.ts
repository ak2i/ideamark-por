import type {
  ChunkWindow,
  ExtractionTask,
  MatchClass,
  PorWarning,
  SlotExtractionResult,
  SlotMatch,
} from "../types.js";

// llm_output_guard (spec §7): validates raw model text into a
// SlotExtractionResult, recomputing offsets from span_text.

const MATCH_CLASSES = new Set(["compatible", "partial", "uncertain", "negative"]);

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // tolerate fenced or prefixed output by taking the outermost braces
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("no JSON object found in model output");
  }
}

export function guardLlmOutput(
  rawText: string,
  task: ExtractionTask,
  chunk: ChunkWindow,
): SlotExtractionResult {
  const warnings: PorWarning[] = [];
  const matches: SlotMatch[] = [];
  const slotSet = new Map(task.slots.map((s) => [s.slot, s.mapped_slot]));

  const parsed = extractJson(rawText) as Record<string, unknown>;
  if (!Array.isArray(parsed.matches)) {
    const keys = Object.keys(parsed).slice(0, 12).join(", ");
    throw new Error(
      `model output must contain a top-level matches array; found keys: ${keys || "<none>"}`,
    );
  }
  const rawMatches = parsed.matches;

  for (const [i, rawMatch] of (rawMatches as unknown[]).entries()) {
    const m = rawMatch as Record<string, unknown>;
    const slot = typeof m?.slot === "string" ? m.slot : "";
    if (!slotSet.has(slot)) {
      warnings.push({
        code: "unknown_slot",
        message: `matches[${i}]: slot \`${slot}\` is not in the task slot set; dropped`,
      });
      continue;
    }
    const spanText = typeof m.span_text === "string" ? m.span_text.trim() : "";
    if (spanText.length === 0) {
      warnings.push({
        code: "empty_span_text",
        message: `matches[${i}]: empty span_text; dropped`,
      });
      continue;
    }

    let confidence = typeof m.confidence === "number" ? m.confidence : NaN;
    if (!Number.isFinite(confidence)) {
      warnings.push({
        code: "invalid_confidence",
        message: `matches[${i}]: missing/invalid confidence; defaulted to 0`,
      });
      confidence = 0;
    }
    confidence = Math.min(1, Math.max(0, confidence));

    let matchClass = typeof m.match_class === "string" ? m.match_class : "";
    if (!MATCH_CLASSES.has(matchClass)) {
      warnings.push({
        code: "invalid_match_class",
        message: `matches[${i}]: match_class \`${matchClass}\` invalid; set to uncertain`,
      });
      matchClass = "uncertain";
    }

    // LLM offsets are advisory: recompute by locating span_text in the chunk.
    const found = chunk.text.indexOf(spanText);
    if (found === -1) {
      warnings.push({
        code: "span_not_in_chunk",
        message: `matches[${i}]: span_text not found verbatim in chunk; kept with approximate anchor`,
      });
    }

    matches.push({
      slot,
      mapped_slot:
        typeof m.mapped_slot === "string" && m.mapped_slot.length > 0
          ? m.mapped_slot
          : (slotSet.get(slot) as string),
      span_text: spanText,
      start_offset: found === -1 ? null : found,
      end_offset: found === -1 ? null : found + spanText.length,
      confidence,
      match_class: matchClass as MatchClass,
      reason: typeof m.reason === "string" ? m.reason : "",
    });
  }

  if (Array.isArray(parsed.warnings)) {
    for (const w of parsed.warnings as unknown[]) {
      const warning = w as Record<string, unknown>;
      if (typeof warning?.message === "string") {
        warnings.push({
          code: typeof warning.code === "string" ? warning.code : "model_warning",
          message: warning.message,
        });
      }
    }
  }

  return {
    task_id: task.task_id,
    source_id: chunk.source_id,
    chunk_id: chunk.chunk_id,
    projection_id: task.projection_id,
    family_id: task.family_id,
    matches,
    warnings,
  };
}
