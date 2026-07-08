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
const ALLOWED_TOP_LEVEL_KEYS = new Set(["matches", "warnings"]);

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

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function requireString(m: Record<string, unknown>, key: string, label: string): string {
  const value = m[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value.trim();
}

function requireNumber(m: Record<string, unknown>, key: string, label: string): number {
  const value = m[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label}.${key} must be a finite number`);
  }
  return value;
}

export function guardLlmOutput(
  rawText: string,
  task: ExtractionTask,
  chunk: ChunkWindow,
): SlotExtractionResult {
  const warnings: PorWarning[] = [];
  const matches: SlotMatch[] = [];
  const slotSet = new Map(task.slots.map((s) => [s.slot, s.mapped_slot]));

  const parsed = assertRecord(extractJson(rawText), "model output");
  const topLevelKeys = Object.keys(parsed);
  const extraKeys = topLevelKeys.filter((key) => !ALLOWED_TOP_LEVEL_KEYS.has(key));
  if (extraKeys.length > 0) {
    throw new Error(
      `model output has unexpected top-level keys: ${extraKeys.slice(0, 12).join(", ")}`,
    );
  }
  if (!Array.isArray(parsed.matches)) {
    const keys = topLevelKeys.slice(0, 12).join(", ");
    throw new Error(
      `model output must contain a top-level matches array; found keys: ${keys || "<none>"}`,
    );
  }
  if (!Array.isArray(parsed.warnings)) {
    throw new Error("model output must contain a top-level warnings array");
  }
  const rawMatches = parsed.matches;

  for (const [i, rawMatch] of (rawMatches as unknown[]).entries()) {
    const label = `matches[${i}]`;
    const m = assertRecord(rawMatch, label);
    const slot = requireString(m, "slot", label);
    const mappedSlot = requireString(m, "mapped_slot", label);
    const spanText = requireString(m, "span_text", label);
    let confidence = requireNumber(m, "confidence", label);
    const matchClassRaw = requireString(m, "match_class", label);
    const reason = requireString(m, "reason", label);

    if (!slotSet.has(slot)) {
      warnings.push({
        code: "unknown_slot",
        message: `${label}: slot \`${slot}\` is not in the task slot set; dropped`,
      });
      continue;
    }

    const expectedMappedSlot = slotSet.get(slot) as string;
    const normalizedMappedSlot = mappedSlot === expectedMappedSlot ? mappedSlot : expectedMappedSlot;
    if (mappedSlot !== expectedMappedSlot) {
      warnings.push({
        code: "mapped_slot_mismatch",
        message: `${label}: mapped_slot \`${mappedSlot}\` does not match task mapping \`${expectedMappedSlot}\`; normalized`,
      });
    }

    confidence = Math.min(1, Math.max(0, confidence));

    if (!MATCH_CLASSES.has(matchClassRaw)) {
      throw new Error(`${label}.match_class \`${matchClassRaw}\` is invalid`);
    }
    const matchClass = matchClassRaw as MatchClass;

    // LLM offsets are advisory: recompute by locating span_text in the chunk.
    const found = chunk.text.indexOf(spanText);
    if (found === -1) {
      warnings.push({
        code: "span_not_in_chunk",
        message: `${label}: span_text not found verbatim in chunk; kept with approximate anchor`,
      });
    }

    matches.push({
      slot,
      mapped_slot: normalizedMappedSlot,
      span_text: spanText,
      start_offset: found === -1 ? null : found,
      end_offset: found === -1 ? null : found + spanText.length,
      confidence,
      match_class: matchClass,
      reason,
    });
  }

  for (const [i, w] of (parsed.warnings as unknown[]).entries()) {
    const warning = w as Record<string, unknown>;
    if (typeof warning?.message === "string") {
      warnings.push({
        code: typeof warning.code === "string" ? warning.code : "model_warning",
        message: warning.message,
      });
    } else if (typeof w === "string") {
      warnings.push({
        code: "model_warning",
        message: w,
      });
    } else if (w !== null && typeof w === "object") {
      warnings.push({
        code: "invalid_model_warning",
        message: `warnings[${i}]: ignored warning without message`,
      });
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
