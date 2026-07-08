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

function optionalString(m: Record<string, unknown>, key: string): string {
  const value = m[key];
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(m: Record<string, unknown>, key: string): number | null {
  const value = m[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dropMatch(warnings: PorWarning[], label: string, code: string, message: string): void {
  warnings.push({
    code,
    message: `${label}: ${message}; dropped`,
  });
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
  const rawWarnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  if (!Array.isArray(parsed.warnings)) {
    warnings.push({
      code: "missing_warnings_array",
      message: "model output did not include warnings array; defaulted to []",
    });
  }
  const rawMatches = parsed.matches;

  for (const [i, rawMatch] of (rawMatches as unknown[]).entries()) {
    const label = `matches[${i}]`;
    if (rawMatch === null || typeof rawMatch !== "object" || Array.isArray(rawMatch)) {
      throw new Error(`${label} must be a JSON object`);
    }
    const m = rawMatch as Record<string, unknown>;
    const slot = optionalString(m, "slot");
    const spanText = optionalString(m, "span_text");

    // A string array in matches is usually a contract failure, not recoverable extraction.
    // Missing span_text inside an object is recoverable: drop the bad object and keep the good ones.
    if (slot.length === 0) {
      dropMatch(warnings, label, "missing_slot", "slot is missing or empty");
      continue;
    }
    if (!slotSet.has(slot)) {
      dropMatch(warnings, label, "unknown_slot", `slot \`${slot}\` is not in the task slot set`);
      continue;
    }
    if (spanText.length === 0) {
      dropMatch(warnings, label, "empty_span_text", "span_text is missing or empty");
      continue;
    }

    const expectedMappedSlot = slotSet.get(slot) as string;
    const mappedSlot = optionalString(m, "mapped_slot");
    const normalizedMappedSlot = mappedSlot === expectedMappedSlot ? mappedSlot : expectedMappedSlot;
    if (mappedSlot.length === 0) {
      warnings.push({
        code: "missing_mapped_slot",
        message: `${label}: mapped_slot missing; filled from task mapping \`${expectedMappedSlot}\``,
      });
    } else if (mappedSlot !== expectedMappedSlot) {
      warnings.push({
        code: "mapped_slot_mismatch",
        message: `${label}: mapped_slot \`${mappedSlot}\` does not match task mapping \`${expectedMappedSlot}\`; normalized`,
      });
    }

    let confidence = optionalNumber(m, "confidence");
    if (confidence === null) {
      warnings.push({
        code: "invalid_confidence",
        message: `${label}: missing/invalid confidence; defaulted to 0`,
      });
      confidence = 0;
    }
    confidence = Math.min(1, Math.max(0, confidence));

    const matchClassRaw = optionalString(m, "match_class");
    let matchClass: MatchClass = "uncertain";
    if (MATCH_CLASSES.has(matchClassRaw)) {
      matchClass = matchClassRaw as MatchClass;
    } else {
      warnings.push({
        code: "invalid_match_class",
        message: `${label}: match_class \`${matchClassRaw}\` invalid; set to uncertain`,
      });
    }

    const reason = optionalString(m, "reason");
    if (reason.length === 0) {
      warnings.push({
        code: "missing_reason",
        message: `${label}: reason missing; defaulted to empty string`,
      });
    }

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

  for (const [i, w] of (rawWarnings as unknown[]).entries()) {
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
