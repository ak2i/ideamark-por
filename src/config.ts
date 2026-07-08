// M1 fixed defaults (spec §1.1, §2.5, §6). Later made configurable.

export const M1_DEFAULTS = {
  chunk_size: 8000,
  chunk_overlap: 2000,
  boundary_snap_window: 200,
  min_match_confidence: 0.35,
  candidate_threshold: 0.5,
  dedup_similarity: 0.85,
  section_merge_gap_ratio: 0.25,
  llm_base_url: "http://localhost:11434/v1",
  llm_model: "qwen3:4b",
} as const;

export interface RunConfig {
  sourcePath: string;
  sourceAdapter: string;
  projectionPath: string;
  projectionId?: string;
  skeletonFamily: string;
  llmProvider: string;
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey?: string;
  outPath: string;
  sessionDir: string;
  docId?: string;
  maxChunks?: number;
  strictValidate: boolean;
  skipValidate: boolean;
  ideamarkCliPath?: string;
}
