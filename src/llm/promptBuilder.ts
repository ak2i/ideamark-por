import type { ChunkWindow, ExtractionTask } from "../types.js";

// Builds one small slot extraction prompt per (task × chunk) (spec §7).
// The LLM never sees the full Projection — only compiled task fields.

export function buildSystemPrompt(): string {
  return [
    "You are a careful information extraction engine.",
    "You extract skeleton slot matches from ONE text chunk.",
    "You must answer with a single JSON object and nothing else.",
    "Never invent text: every span_text must be copied verbatim from the chunk.",
    "If nothing matches a slot, simply omit it. An empty matches list is a valid answer.",
  ].join(" ");
}

export function buildUserPrompt(task: ExtractionTask, chunk: ChunkWindow): string {
  const slotLines = task.slots
    .map(
      (s) =>
        `- slot: ${s.slot}\n  mapped_slot: ${s.mapped_slot}${s.focus ? "\n  priority: high (projection entity focus)" : ""}`,
    )
    .join("\n");

  const contextLines = [
    task.domain_hint ? `Domain: ${task.domain_hint}` : null,
    task.purpose ? `Purpose: ${task.purpose}` : null,
    task.primary_match ? `Primary match expectation: ${task.primary_match}` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `Extract skeleton slot matches for family "${task.family_title}".
${contextLines ? contextLines + "\n" : ""}
Slots to look for:
${slotLines}

Rules:
- span_text: a short verbatim excerpt (<= 400 chars) from the chunk that fills the slot.
- confidence: 0.0-1.0.
- match_class: "compatible" (clearly fills the slot), "partial" (incomplete), "uncertain", or "negative" (material that looks related but should be rejected).
- reason: one short sentence.
- Report at most 3 matches per slot.

Answer with JSON only, in this exact shape:
{"matches":[{"slot":"...","mapped_slot":"...","span_text":"...","confidence":0.0,"match_class":"compatible","reason":"..."}],"warnings":[]}

Chunk (id ${chunk.chunk_id}, source offsets ${chunk.start_offset}-${chunk.end_offset}):
<<<CHUNK
${chunk.text}
CHUNK>>>`;
}

export const RETRY_SUFFIX =
  "\n\nYour previous answer was not valid JSON. Answer again with ONLY the JSON object described above.";
