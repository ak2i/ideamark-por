import { M1_DEFAULTS } from "../config.js";
import type {
  MatchCluster,
  SourceRecord,
  SourceWindowCandidate,
} from "../types.js";

// candidate_builder (spec §8 steps 5-6): promoted clusters become source
// window candidates; nearby windows merge into one Section window.

function lineBounds(
  text: string,
  start: number,
  end: number,
): { start: number; end: number; startLine: number; endLine: number } {
  let s = text.lastIndexOf("\n", Math.max(0, start - 1));
  s = s === -1 ? 0 : s + 1;
  let e = text.indexOf("\n", end);
  e = e === -1 ? text.length : e;
  let startLine = 1;
  for (let i = 0; i < s; i++) if (text[i] === "\n") startLine += 1;
  let endLine = startLine;
  for (let i = s; i < e; i++) if (text[i] === "\n") endLine += 1;
  return { start: s, end: e, startLine, endLine };
}

export function buildSourceWindows(
  clusters: MatchCluster[],
  source: SourceRecord,
): SourceWindowCandidate[] {
  const promoted = clusters
    .filter((c) => c.promoted)
    .sort((a, b) => a.start - b.start);
  if (promoted.length === 0) return [];

  const mergeGap = M1_DEFAULTS.chunk_size * M1_DEFAULTS.section_merge_gap_ratio;
  const unitText = new Map(source.units.map((u) => [u.source_unit_id, u.text]));

  const windows: SourceWindowCandidate[] = [];
  let current: { start: number; end: number; unitId: string; clusterIds: string[] } | null =
    null;

  const flush = (): void => {
    if (!current) return;
    const text = unitText.get(current.unitId) ?? "";
    const bounds = lineBounds(text, current.start, current.end);
    windows.push({
      window_id: `window-${windows.length}`,
      source_id: source.source_id,
      source_unit_id: current.unitId,
      start: bounds.start,
      end: bounds.end,
      start_line: bounds.startLine,
      end_line: bounds.endLine,
      cluster_ids: current.clusterIds,
    });
    current = null;
  };

  for (const cluster of promoted) {
    if (
      current &&
      current.unitId === cluster.source_unit_id &&
      cluster.start - current.end < mergeGap
    ) {
      current.end = Math.max(current.end, cluster.end);
      current.clusterIds.push(cluster.cluster_id);
    } else {
      flush();
      current = {
        start: cluster.start,
        end: cluster.end,
        unitId: cluster.source_unit_id,
        clusterIds: [cluster.cluster_id],
      };
    }
  }
  flush();
  return windows;
}
