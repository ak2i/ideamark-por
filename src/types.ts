// Shared M1 pipeline types.
// Contract: docs/dev/v0.2.0/por-m1-text-to-ideamark.md

export interface PorWarning {
  code: string;
  message: string;
}

// --- Source adapter output (spec §5) ---

export interface SourceUnit {
  source_unit_id: string;
  text: string;
  char_length: number;
  line_count: number;
}

export interface SourceRecord {
  source_id: string;
  source_uri: string;
  source_media_type: string;
  source_adapter: string;
  title: string;
  units: SourceUnit[];
  warnings: PorWarning[];
}

// --- Skeleton Family library ---

export interface SkeletonFamilyLink {
  type: string;
  from: string;
  to: string;
}

export interface SkeletonFamily {
  id: string;
  title: string;
  purpose?: string;
  canonical_slots: string[];
  common_links?: SkeletonFamilyLink[];
  expected_match_classes?: string[];
}

export interface SkeletonFamilyLibrary {
  library_id: string;
  families: SkeletonFamily[];
}

// --- Projection (M1 subset, spec §3) ---

export interface ProjectionFamilyUse {
  ref: string;
  slot_mapping: Record<string, string>;
}

export interface Projection {
  id: string;
  title: string;
  domain_hint?: string;
  purpose?: string;
  uses_skeleton_families: ProjectionFamilyUse[];
  decomposition_guidance?: {
    section_strategy?: string;
    entity_focus?: string[];
  };
  retrieval_expectations?: {
    primary_match?: string;
    expected_outputs?: string[];
  };
  evaluation_tests?: string[];
}

export interface ProjectionLoadResult {
  projection: Projection;
  warnings: PorWarning[];
}

// --- Compiled extraction tasks (spec §4) ---

export interface TaskSlot {
  slot: string;
  mapped_slot: string;
  focus: boolean;
}

export interface ExtractionTask {
  task_id: string;
  projection_id: string;
  family_id: string;
  family_title: string;
  domain_hint: string | null;
  purpose: string | null;
  primary_match: string | null;
  entity_focus: string[];
  slots: TaskSlot[];
}

// --- Chunking (spec §6) ---

export interface ChunkWindow {
  chunk_id: string;
  source_id: string;
  source_unit_id: string;
  index: number;
  text: string;
  start_offset: number;
  end_offset: number;
  start_line: number;
  end_line: number;
}

// --- LLM slot extraction output (spec §7) ---

export type MatchClass = "compatible" | "partial" | "uncertain" | "negative";

export interface SlotMatch {
  slot: string;
  mapped_slot: string;
  span_text: string;
  start_offset: number | null;
  end_offset: number | null;
  confidence: number;
  match_class: MatchClass;
  reason: string;
}

export interface SlotExtractionResult {
  task_id: string;
  source_id: string;
  chunk_id: string;
  projection_id: string;
  family_id: string;
  matches: SlotMatch[];
  warnings: PorWarning[];
}

// Match after offset resolution against the source unit, ready for clustering.
export interface ResolvedMatch extends SlotMatch {
  task_id: string;
  source_id: string;
  source_unit_id: string;
  chunk_id: string;
  projection_id: string;
  family_id: string;
  // offsets into the whole source unit; null when span_text was not found
  unit_start: number | null;
  unit_end: number | null;
  support: number; // duplicate support count after dedup (>= 1)
}

// --- Clusters and candidates (spec §8) ---

export interface MatchCluster {
  cluster_id: string;
  family_id: string;
  projection_id: string;
  source_id: string;
  source_unit_id: string;
  members: ResolvedMatch[];
  start: number;
  end: number;
  score: number;
  score_parts: {
    avg_confidence: number;
    slot_coverage: number;
    support: number;
    focus: number;
  };
  promoted: boolean;
}

export interface SourceWindowCandidate {
  window_id: string;
  source_id: string;
  source_unit_id: string;
  start: number;
  end: number;
  start_line: number;
  end_line: number;
  cluster_ids: string[];
}

// --- Core draft (spec §9) ---

export interface CoreDraft {
  meta: Record<string, unknown>;
  sources: Record<string, unknown>[];
  sections: Record<string, unknown>[];
  occurrences: Record<string, unknown>[];
  entities: Record<string, unknown>[];
}

// --- Validation handoff (spec §10) ---

export interface ValidationDiagnostic {
  severity: string;
  code: string;
  message: string;
  path?: string;
  object_id?: string;
  related_ids: string[];
}

export interface ValidationResult {
  status: "ok" | "failed" | "skipped" | "cli_not_found" | "cli_error";
  cli_path?: string;
  exit_code?: number;
  error_count: number;
  warning_count: number;
  diagnostics: ValidationDiagnostic[];
  raw: string;
}
