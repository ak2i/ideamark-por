import { createHash } from "node:crypto";
import { M1_DEFAULTS } from "../config.js";
import type {
  CoreDraft,
  MatchCluster,
  Projection,
  ResolvedMatch,
  SourceRecord,
  SourceWindowCandidate,
} from "../types.js";

// core_draft_assembler (spec §9): mechanically emit the five required
// Core v1.2.0 namespaces from promoted clusters and merged source windows.

const POR_VERSION = "0.2.0-dev";

function shortName(uri: string): string {
  const tail = uri.split("://")[1] ?? uri;
  const parts = tail.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return /^v\d+$/.test(last) && parts.length > 1 ? parts[parts.length - 2] : last;
}

function bestSlotMatches(cluster: MatchCluster): Map<string, ResolvedMatch> {
  const slots = new Map<string, ResolvedMatch>();
  for (const m of cluster.members) {
    const existing = slots.get(m.mapped_slot);
    if (!existing || m.confidence > existing.confidence) slots.set(m.mapped_slot, m);
  }
  return slots;
}

export interface AssemblyInput {
  source: SourceRecord;
  projection: Projection;
  clusters: MatchCluster[];
  windows: SourceWindowCandidate[];
  generation: {
    provider: string;
    model: string | null;
    chunk_count: number;
    task_count: number;
    raw_match_count: number;
  };
  docId?: string;
  sourceTitle?: string;
}

export function assembleCoreDraft(input: AssemblyInput): CoreDraft {
  const { source, projection, clusters, windows } = input;
  const promoted = clusters.filter((c) => c.promoted);
  const clusterIndex = new Map(promoted.map((c, i) => [c.cluster_id, i]));

  const docHash = createHash("sha256")
    .update(source.source_id + projection.id)
    .digest("hex")
    .slice(0, 8);

  const entities: Record<string, unknown>[] = [];
  const occurrences: Record<string, unknown>[] = [];

  for (const cluster of promoted) {
    const index = clusterIndex.get(cluster.cluster_id) as number;
    const slots = bestSlotMatches(cluster);
    const contentLines = [...slots.entries()].map(
      ([slot, match]) => `${slot}: ${match.span_text}`,
    );
    const topReasons = [...slots.values()]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2)
      .map((m) => m.reason)
      .filter((r) => r.length > 0);

    entities.push({
      id: `ENT-c${index}`,
      kind: "reusable_material_candidate",
      content: contentLines.join("\n"),
    });

    const anchors = [...slots.values()]
      .filter((m) => m.unit_start !== null)
      .map((m) => ({ start: m.unit_start, end: m.unit_end }));
    occurrences.push({
      id: `OCC-c${index}`,
      entity: `ENT-c${index}`,
      role: `matches_${shortName(cluster.family_id).replace(/-/g, "_")}`,
      rationale:
        topReasons.length > 0
          ? topReasons.join(" / ")
          : `mechanical assembly from ${slots.size} matched slot(s) of ${cluster.family_id}`,
      confidence: Number(cluster.score.toFixed(3)),
      status: "provisional",
      anchors:
        anchors.length > 0
          ? [
              {
                source: source.source_id,
                type: "char_range",
                ranges: anchors,
                precision: "exact",
                role: "extraction_evidence",
              },
            ]
          : [
              {
                source: source.source_id,
                type: "char_range",
                ranges: [{ start: cluster.start, end: cluster.end }],
                precision: "approximate",
                role: "extraction_evidence",
              },
            ],
    });
  }

  const sections: Record<string, unknown>[] = windows.map((window, i) => {
    const memberOccurrences = window.cluster_ids
      .map((id) => clusterIndex.get(id))
      .filter((idx): idx is number => idx !== undefined)
      .sort(
        (a, b) =>
          promoted[a].start - promoted[b].start || promoted[a].end - promoted[b].end,
      )
      .map((idx) => `OCC-c${idx}`);
    return {
      id: `SEC-w${i}`,
      title: `Source window ${window.start_line}-${window.end_line}`,
      anchors: [
        {
          source: source.source_id,
          type: "char_range",
          ranges: [{ start: window.start, end: window.end }],
          precision: "exact",
          role: "source_context",
        },
      ],
      occurrences: memberOccurrences,
    };
  });

  const meta: Record<string, unknown> = {
    spec_version: "ideamark-core-v1.2.0",
    document_id: input.docId ?? `por-${docHash}`,
    status: "draft",
    title: `${input.sourceTitle ?? source.title} — ${projection.title}`,
    projections: [{ role: "generation", ref: projection.id }],
    x_por_generation: {
      tool: "ideamark-por",
      tool_version: POR_VERSION,
      llm_provider: input.generation.provider,
      llm_model: input.generation.model,
      chunk_count: input.generation.chunk_count,
      task_count: input.generation.task_count,
      raw_match_count: input.generation.raw_match_count,
      promoted_cluster_count: promoted.length,
      thresholds: {
        min_match_confidence: M1_DEFAULTS.min_match_confidence,
        candidate_threshold: M1_DEFAULTS.candidate_threshold,
      },
    },
  };

  return {
    meta,
    sources: [
      {
        id: source.source_id,
        type: source.source_uri === "stdin:" ? "stdin" : "text_file",
        title: source.title,
        uri: source.source_uri,
      },
    ],
    sections,
    occurrences,
    entities,
  };
}
