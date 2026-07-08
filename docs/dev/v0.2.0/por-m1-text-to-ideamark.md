# POR M1 — Text-to-IdeaMark Milestone Spec

Status: frozen for M1 implementation
Baseline: `docs/dev/v0.2.0/por-v0.2.0-planning.md`
Target Core spec: `ideamark-core-v1.2.0`

This document turns the v0.2.0 planning baseline into an implementation-oriented
contract. A developer should be able to implement M1 from this document without
needing the full future POR design.

## 1. Command contract

### 1.1 `ideamark-por generate`

```bash
ideamark-por generate \
  --source ./large-source.txt \
  --source-adapter text \
  --projection ./projection.yaml \
  --skeleton-family default \
  --llm-provider local \
  --out ./generated.ideamark.yaml
```

Options:

| Option | Required | Default | Meaning |
| --- | --- | --- | --- |
| `--source <path>` | yes (`-` for stdin) | — | Original Source input |
| `--source-adapter <name>` | no | `text` | M1 supports `text` only |
| `--projection <path>` | yes | — | Projection file or Projection Library file |
| `--projection-id <id>` | when library has >1 projection | — | selects one Projection from a library |
| `--skeleton-family <name\|path>` | no | `default` | `default` = built-in library; a path loads an external family library |
| `--llm-provider <name>` | no | `local` | `local`, `mock` |
| `--llm-base-url <url>` | no | `http://localhost:11434/v1` | OpenAI-compatible chat completions base URL |
| `--llm-model <name>` | no | `llama3.1` | model name passed to the endpoint |
| `--out <path>` | yes | — | generated IdeaMark Core draft path |
| `--session-dir <path>` | no | `<out>.por-session/` | session/evidence directory |
| `--max-chunks <n>` | no | unlimited | processing cap for tests |
| `--strict-validate` | no | off | non-zero exit when `ideamark-cli validate` fails |
| `--skip-validate` | no | off | skip the `ideamark-cli` handoff |

Environment variables `IDEAMARK_POR_LLM_BASE_URL`, `IDEAMARK_POR_LLM_MODEL`,
and `IDEAMARK_POR_LLM_API_KEY` override the corresponding defaults.

### 1.2 `ideamark-por plan`

Phase 1 exit criterion command: list which family/slot extraction tasks would run
for a given source + Projection, without calling any LLM.

```bash
ideamark-por plan \
  --source ./large-source.txt \
  --projection ./projection.yaml \
  --format json|text
```

### 1.3 Session directory layout

```text
<session-dir>/
  run.json                 # run metadata: args, timestamps, versions, chunk stats
  source/records.json      # normalized source records + units
  tasks.json               # compiled slot extraction tasks
  matches/<chunk_id>.json  # raw guarded LLM outputs per chunk
  clusters.json            # dedup + cluster results with scores
  candidates.json          # promoted candidates
  diagnostics.json         # ideamark-cli validate output + mapping to candidates
```

Everything in the session directory is POR-owned state and never required for
Core document validity.

## 2. Decisions on planning open questions

1. **Built-in Skeleton Family version**: M1 packages the sample library
   `skeleton-family-library://samples/ideamark-core-v1.2.0/v0`
   (`docs/specs/V1.2.0/sample/skeleton-families.yaml`) as the built-in default.
2. **Projection input**: both shapes are accepted. A file containing a single
   Projection object is used directly; a Projection Library file (`projections:` list)
   requires `--projection-id` when it contains more than one Projection.
3. **First local LLM endpoint**: generic OpenAI-compatible chat completions
   (`POST <base>/chat/completions`). This covers Ollama (`/v1`) and LM Studio.
   A `mock` provider exists for tests and offline runs.
4. **Offsets**: optional in LLM output. POR derives offsets deterministically by
   searching `span_text` inside the chunk; unresolvable spans keep chunk-level
   anchors with `precision: approximate`.
5. **Initial thresholds** (provisional, tuned during tests):
   `min_match_confidence = 0.35` (matches below are stored but excluded from
   clustering), `candidate_threshold = 0.5` (cluster score needed for promotion).
6. **Partial slot coverage**: a cluster is promoted when its score passes the
   threshold, even with partial slot coverage; each promoted cluster emits one
   Entity + one Occurrence, and Sections are built from the source windows of
   promoted clusters. Empty namespaces are emitted as empty lists rather than
   omitted.
7. **Validation failure**: default behavior emits the draft plus diagnostics and
   exits 0 with a warning summary. `--strict-validate` makes validation failure
   exit non-zero. A missing/unresolvable `ideamark-cli` degrades to a warning.
8. **Evidence placement**: extraction evidence (raw LLM outputs, cluster scores,
   duplicate support) stays in the session directory. The emitted document only
   carries generation metadata in `meta`, plus per-Occurrence `confidence` and
   `rationale`.

## 3. M1 Projection subset

POR reads only this subset; unknown fields are preserved as opaque notes in
session metadata and otherwise ignored.

```yaml
id: projection://...            # required
title: string                   # required
domain_hint: string             # optional, used in prompts
purpose: string                 # optional, used in prompts
uses_skeleton_families:         # required, at least one entry
  - ref: skeleton-family://...  # must resolve in the active family library
    slot_mapping:               # canonical_slot -> mapped (projected) slot name
      canonical_slot_name: mapped_slot_name
decomposition_guidance:
  section_strategy: string      # optional
  entity_focus: [string]        # optional, ranking/filter hint
retrieval_expectations:
  primary_match: string         # optional, prompt hint
  expected_outputs: [string]    # optional, notes only
evaluation_tests: [string]      # optional, non-blocking notes
```

Loader rules:

- A `uses_skeleton_families[].ref` that is missing from the family library is an error.
- `slot_mapping` keys that are not canonical slots of the referenced family produce
  a warning and are skipped.
- Canonical slots absent from `slot_mapping` are still extracted under their
  canonical name (identity mapping).

## 4. Compiled extraction task shape

`projection_runtime_compiler` output, one task per (family × chunk):

```json
{
  "task_id": "task:<projection-short>:<family-short>",
  "projection_id": "projection://...",
  "family_id": "skeleton-family://...",
  "family_title": "string",
  "domain_hint": "string|null",
  "purpose": "string|null",
  "primary_match": "string|null",
  "entity_focus": ["string"],
  "slots": [
    { "slot": "canonical_slot", "mapped_slot": "projected_slot", "focus": true }
  ]
}
```

`focus` is true when the mapped slot name appears in `entity_focus` (used only
as a scoring hint downstream).

## 5. Text adapter output shape

```json
{
  "source_id": "src-<basename-or-stdin>-<hash8>",
  "source_uri": "file:///abs/path or stdin:",
  "source_media_type": "text/plain",
  "source_adapter": "text",
  "units": [
    {
      "source_unit_id": "<source_id>#u0",
      "text": "entire normalized text",
      "char_length": 0,
      "line_count": 0
    }
  ],
  "warnings": [{ "code": "string", "message": "string" }]
}
```

Normalization: decode UTF-8, convert CRLF/CR to LF. Character offsets are
JavaScript UTF-16 code-unit offsets, applied consistently on both anchor
creation and lookup. M1 emits exactly one unit per source.

## 6. Chunk/window defaults

| Setting | M1 fixed value |
| --- | --- |
| `chunk_size` | 8,000 characters (≈2,000–2,700 tokens) |
| `chunk_overlap` | 2,000 characters (25%) |
| boundary snap | prefer breaking at a newline within ±200 chars of the cut point |
| `chunk_id` | `<source_unit_id>:c<index>` |

Every chunk records `start_offset` / `end_offset` into its source unit and
`start_line` / `end_line`.

## 7. Local LLM output schema

The LLM answers one task for one chunk. It never generates IdeaMark documents.

```json
{
  "task_id": "string",
  "source_id": "string",
  "chunk_id": "string",
  "projection_id": "string",
  "family_id": "string",
  "matches": [
    {
      "slot": "string",
      "mapped_slot": "string",
      "span_text": "string",
      "start_offset": 0,
      "end_offset": 0,
      "confidence": 0.0,
      "match_class": "compatible|partial|uncertain|negative",
      "reason": "string"
    }
  ],
  "warnings": [{ "code": "string", "message": "string" }]
}
```

`llm_output_guard` rules:

- Reject non-JSON output; retry once with a corrective suffix, then record a
  warning and continue with zero matches for that chunk/task.
- Drop matches whose `slot` is not in the task slot set (warning).
- Clamp `confidence` to [0,1]; missing/invalid `match_class` becomes `uncertain`.
- `negative` matches are stored for evidence but never clustered.
- Offsets are recomputed by locating `span_text` in the chunk; LLM-provided
  offsets are advisory only.

## 8. Candidate assembly rules

1. Collect guarded matches from all chunks with
   `confidence >= min_match_confidence` and `match_class != negative`.
2. **Dedup**: two matches merge when same `family_id` + same `mapped_slot` and
   (source spans overlap, or normalized `span_text` similarity ≥ 0.85 by token
   Jaccard). Merged match keeps highest confidence and counts duplicate support.
3. **Cluster**: greedy pass over deduped matches sorted by source position;
   a match joins an open cluster of the same family when its span is within
   one `chunk_size` of the cluster's span envelope and its `mapped_slot` is not
   already filled with a higher-confidence match filling the same slot (equal
   slots may co-exist as alternates but do not extend coverage).
4. **Score**: `score = 0.45*avg_confidence + 0.25*slot_coverage + 0.20*support + 0.10*focus`
   where `slot_coverage` = filled distinct slots / family canonical slots,
   `support` = min(1, (total duplicate support - 1) / 3),
   `focus` = fraction of filled slots whose mapped slot is in `entity_focus`.
5. **Promote** clusters with `score >= candidate_threshold`:
   - one `reusable_material_candidate` (→ Entity) per cluster, content synthesized
     mechanically from best spans per slot;
   - one `placement_candidate` (→ Occurrence) per cluster with role
     `matches_<family-short-name>` and anchors covering member spans;
   - one `source_window_candidate` (→ Section) per cluster from the span envelope
     expanded to line boundaries.
6. Nearby promoted windows (gap < 25% of `chunk_size`) merge into one Section;
   Occurrence order inside a Section follows source position.

## 9. Core draft assembly

Emitted namespaces (all five always present):

- `meta`: `spec_version: ideamark-core-v1.2.0`, `document_id` (`por-<hash>` or
  from `--doc-id`), `status: draft`, `title` derived from source name +
  Projection title, `projections: [{role: generation, ref: <projection id>}]`,
  and an `x_por_generation` extension block (tool version, provider, model,
  chunk stats, thresholds).
- `sources`: one entry per source record (`id`, `type: text_file|stdin`,
  `title`, `uri`).
- `sections`: from merged source windows; each carries a `char_range` anchor
  (`precision: exact` when offsets resolved, else `approximate`,
  `role: source_context`) and ordered `occurrences` refs.
- `occurrences`: `id`, `entity`, `role`, `rationale` (top slot reasons),
  `confidence` (cluster score), `status: provisional`.
- `entities`: `id`, `kind: reusable_material_candidate`, `content` synthesized
  as `mapped_slot: best span text` lines per filled slot.

ID scheme: `SRC-*`, `SEC-w<n>`, `OCC-c<n>`, `ENT-c<n>` (stable per run,
derived from cluster/window indexes).

## 10. Validation handoff

- Resolve `ideamark-cli` via: explicit `--ideamark-cli <path>`, then local
  `node_modules/.bin/ideamark-cli`, then `PATH`.
- Run `ideamark-cli validate --format json <out>` (fall back to plain output
  parsing when JSON is unsupported).
- Store raw + parsed diagnostics in `<session-dir>/diagnostics.json`, mapping
  diagnostics to candidate/section ids where the message contains a known id.
- Print a summary: chunk count, task count, match/cluster/candidate counts,
  namespace sizes, validation verdict.
- M1 does not implement LLM-based repair; diagnostics are review signals only.

## 11. End-to-end test scenario

1. Fixture: a plain-text article (~20k chars) with recognizable
   evidence/decision material, plus the sample Projection
   `projection://samples/observation-to-recommendation/v0`.
2. Run `plan` → expect one task (evidence-supported-decision family) listing six
   slot mappings.
3. Run `generate --llm-provider mock` (mock returns deterministic matches per
   chunk) → expect: session dir populated, draft file with all five namespaces,
   ≥1 promoted candidate, sections referencing occurrences that reference
   entities, and exit code 0.
4. If `ideamark-cli` is installed, `validate` runs and its diagnostics land in
   `diagnostics.json`; otherwise a `cli_not_found` warning is recorded.
