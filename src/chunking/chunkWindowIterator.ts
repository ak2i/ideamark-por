import { M1_DEFAULTS } from "../config.js";
import type { ChunkWindow, SourceRecord } from "../types.js";

// Fixed-default overlapping chunk windows (spec §6): 8000 chars, 2000 overlap,
// cut points snapped to a newline within ±200 chars when possible.

function snapToNewline(text: string, cut: number, window: number): number {
  if (cut >= text.length) return text.length;
  const from = Math.max(0, cut - window);
  const to = Math.min(text.length, cut + window);
  let best = -1;
  for (let i = cut; i >= from; i--) {
    if (text[i] === "\n") {
      best = i + 1;
      break;
    }
  }
  if (best === -1) {
    for (let i = cut + 1; i < to; i++) {
      if (text[i] === "\n") {
        best = i + 1;
        break;
      }
    }
  }
  return best === -1 ? cut : best;
}

function lineAt(lineStarts: number[], offset: number): number {
  // binary search: number of line starts <= offset
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1; // 1-based line number
}

export function chunkSource(
  source: SourceRecord,
  options?: { chunkSize?: number; chunkOverlap?: number; maxChunks?: number },
): ChunkWindow[] {
  const chunkSize = options?.chunkSize ?? M1_DEFAULTS.chunk_size;
  const overlap = options?.chunkOverlap ?? M1_DEFAULTS.chunk_overlap;
  const snap = M1_DEFAULTS.boundary_snap_window;
  const chunks: ChunkWindow[] = [];

  for (const unit of source.units) {
    const text = unit.text;
    const lineStarts: number[] = [0];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\n") lineStarts.push(i + 1);
    }

    let start = 0;
    let index = 0;
    while (start < text.length) {
      let end = Math.min(text.length, start + chunkSize);
      if (end < text.length) end = snapToNewline(text, end, snap);
      chunks.push({
        chunk_id: `${unit.source_unit_id}:c${index}`,
        source_id: source.source_id,
        source_unit_id: unit.source_unit_id,
        index,
        text: text.slice(start, end),
        start_offset: start,
        end_offset: end,
        start_line: lineAt(lineStarts, start),
        end_line: lineAt(lineStarts, Math.max(start, end - 1)),
      });
      index += 1;
      if (end >= text.length) break;
      let next = end - overlap;
      if (next <= start) next = start + Math.max(1, chunkSize - overlap);
      start = snapToNewline(text, next, snap);
      if (start >= end) start = next; // never skip material because of snapping
      if (options?.maxChunks && chunks.length >= options.maxChunks) return chunks;
    }
    if (text.length === 0) {
      chunks.push({
        chunk_id: `${unit.source_unit_id}:c0`,
        source_id: source.source_id,
        source_unit_id: unit.source_unit_id,
        index: 0,
        text: "",
        start_offset: 0,
        end_offset: 0,
        start_line: 1,
        end_line: 1,
      });
    }
    if (options?.maxChunks && chunks.length >= options.maxChunks) {
      return chunks.slice(0, options.maxChunks);
    }
  }
  return chunks;
}
