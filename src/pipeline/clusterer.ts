import { M1_DEFAULTS } from "../config.js";
import type { MatchCluster, ResolvedMatch } from "../types.js";

// slot_match_clusterer (spec §8 steps 1-4): filter, dedup, cluster, score.

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9À-￿]+/)
      .filter((t) => t.length > 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function spansOverlap(a: ResolvedMatch, b: ResolvedMatch): boolean {
  if (a.unit_start === null || b.unit_start === null) return false;
  return (
    a.unit_start < (b.unit_end as number) && b.unit_start < (a.unit_end as number)
  );
}

/**
 * Dedup rule (spec §8.2): same family + same mapped_slot and either
 * overlapping source spans or span_text token-Jaccard >= dedup_similarity.
 * The merged match keeps the highest confidence and accumulates support.
 */
export function dedupMatches(
  matches: ResolvedMatch[],
  minConfidence: number = M1_DEFAULTS.min_match_confidence,
): ResolvedMatch[] {
  const eligible = matches.filter(
    (m) => m.match_class !== "negative" && m.confidence >= minConfidence,
  );
  const deduped: ResolvedMatch[] = [];
  const tokens = new Map<ResolvedMatch, Set<string>>();

  for (const match of eligible) {
    const matchTokens = tokenSet(match.span_text);
    const duplicate = deduped.find(
      (kept) =>
        kept.family_id === match.family_id &&
        kept.mapped_slot === match.mapped_slot &&
        (spansOverlap(kept, match) ||
          jaccard(tokens.get(kept) as Set<string>, matchTokens) >=
            M1_DEFAULTS.dedup_similarity),
    );
    if (duplicate) {
      duplicate.support += 1;
      if (match.confidence > duplicate.confidence) {
        // keep the strongest evidence for this span
        const support = duplicate.support;
        Object.assign(duplicate, match, { support });
        tokens.set(duplicate, matchTokens);
      }
    } else {
      const copy = { ...match };
      deduped.push(copy);
      tokens.set(copy, matchTokens);
    }
  }
  return deduped;
}

/**
 * Greedy clustering (spec §8.3): matches sorted by source position join an
 * open cluster of the same family when within one chunk_size of its span
 * envelope. Matches without resolved offsets attach to the current cluster
 * of their chunk's family, or start their own.
 */
export function clusterMatches(
  matches: ResolvedMatch[],
  options?: { chunkSize?: number },
): MatchCluster[] {
  const chunkSize = options?.chunkSize ?? M1_DEFAULTS.chunk_size;

  const anchored = matches
    .filter((m) => m.unit_start !== null)
    .sort((a, b) => (a.unit_start as number) - (b.unit_start as number));
  const unanchored = matches.filter((m) => m.unit_start === null);

  const clusters: MatchCluster[] = [];
  const open = new Map<string, MatchCluster>(); // family_id -> last open cluster

  let clusterIndex = 0;
  const newCluster = (match: ResolvedMatch): MatchCluster => {
    const cluster: MatchCluster = {
      cluster_id: `cluster-${clusterIndex++}`,
      family_id: match.family_id,
      projection_id: match.projection_id,
      source_id: match.source_id,
      source_unit_id: match.source_unit_id,
      members: [match],
      start: match.unit_start ?? 0,
      end: match.unit_end ?? 0,
      score: 0,
      score_parts: { avg_confidence: 0, slot_coverage: 0, support: 0, focus: 0 },
      promoted: false,
    };
    clusters.push(cluster);
    open.set(match.family_id, cluster);
    return cluster;
  };

  for (const match of anchored) {
    const cluster = open.get(match.family_id);
    if (cluster && (match.unit_start as number) - cluster.end <= chunkSize) {
      cluster.members.push(match);
      cluster.start = Math.min(cluster.start, match.unit_start as number);
      cluster.end = Math.max(cluster.end, match.unit_end as number);
    } else {
      newCluster(match);
    }
  }

  for (const match of unanchored) {
    // attach by chunk proximity: reuse the cluster containing members of the
    // same chunk and family, otherwise skip (no reliable position)
    const home = clusters.find(
      (c) =>
        c.family_id === match.family_id &&
        c.members.some((m) => m.chunk_id === match.chunk_id),
    );
    if (home) home.members.push(match);
  }

  return clusters;
}

/**
 * Score (spec §8.4):
 * 0.45*avg_confidence + 0.25*slot_coverage + 0.20*support + 0.10*focus
 */
export function scoreClusters(
  clusters: MatchCluster[],
  familySlotCounts: Map<string, number>,
  entityFocus: string[],
  threshold: number = M1_DEFAULTS.candidate_threshold,
): MatchCluster[] {
  const focusSet = new Set(entityFocus);
  for (const cluster of clusters) {
    const slots = new Map<string, ResolvedMatch>();
    for (const m of cluster.members) {
      const existing = slots.get(m.mapped_slot);
      if (!existing || m.confidence > existing.confidence) slots.set(m.mapped_slot, m);
    }
    const filled = [...slots.values()];
    const avgConfidence =
      filled.reduce((s, m) => s + m.confidence, 0) / Math.max(1, filled.length);
    const totalSlots = familySlotCounts.get(cluster.family_id) ?? filled.length;
    const slotCoverage = filled.length / Math.max(1, totalSlots);
    const totalSupport = cluster.members.reduce((s, m) => s + m.support, 0);
    const support = Math.min(1, (totalSupport - 1) / 3);
    const focus =
      filled.length === 0
        ? 0
        : filled.filter((m) => focusSet.has(m.mapped_slot)).length / filled.length;

    cluster.score_parts = {
      avg_confidence: avgConfidence,
      slot_coverage: slotCoverage,
      support,
      focus,
    };
    cluster.score =
      0.45 * avgConfidence + 0.25 * slotCoverage + 0.2 * support + 0.1 * focus;
    cluster.promoted = cluster.score >= threshold;
  }
  return clusters;
}
