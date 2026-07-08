# IdeaMark-POR v0.2.0 Planning

## Decision

Create a new `docs/dev/v0.2.0` development line instead of extending `docs/dev/v0.1.0` in place.

`docs/dev/v0.1.0` should be retained as historical design material because it defines the original POR idea: a stateful, context-force-first engine that accumulates provisional candidates, supports retroactive reinterpretation, and hands final documents to `ideamark-cli`.

However, IdeaMark Core v1.2.0 changes the boundary conditions enough that POR needs a new planning baseline:

- Core v1.2.0 uses required top-level namespaces: `meta`, `sources`, `sections`, `occurrences`, and `entities`.
- Sections are Projection-shaped local source windows, not necessarily headings, topics, or semantic units.
- Occurrences are role-bearing placements of Entity material inside Sections, not mere mentions or text spans.
- Entities are Projection-shaped reusable material, not universal semantic atoms.
- Projection can guide progressive authoring engines, but POR internals remain a companion responsibility outside Core.
- `ideamark-cli` remains the stateless validation / describe / export boundary, while POR owns progressive session state.

Therefore v0.2.0 should reuse v0.1.0's conceptual machinery, but realign its emitted artifacts and internal terminology with IdeaMark Core v1.2.0.

## Milestone 1 — Text-to-IdeaMark POR prototype

The first milestone should be a practical test milestone, not a complete POR platform.

Goal:

> Given one large text source, one Projection or Projection Set, the built-in default Skeleton Family Library, and a local LLM, POR can extract skeleton slot matches from overlapping chunks, mechanically assemble a rough IdeaMark Core draft, run `ideamark-cli validate`, and produce a reviewable IdeaMark Document or diagnostics.

### M1 scope

M1 includes:

- one large plain text input file;
- the `text` Source Adapter only;
- one Projection file or one Projection selected from a Projection library;
- built-in default Skeleton Families;
- Projection-driven family selection and slot mapping;
- fixed default chunk/window settings;
- local LLM skeleton slot extraction;
- simple clustering and threshold filtering;
- mechanical Core draft assembly;
- `ideamark-cli validate` handoff;
- storage of diagnostics and local extraction evidence.

M1 does not include:

- PDF, GitHub repository, HTML, audio, or video adapters;
- multi-source batch manifests;
- advanced graph database optimization;
- high-quality final document polishing;
- global document rewrite by LLM;
- complete Projection language design;
- automatic support for all future Skeleton Family variants.

### M1 default command shape

```bash
ideamark-por generate \
  --source ./large-source.txt \
  --source-adapter text \
  --projection ./projection.yaml \
  --skeleton-family default \
  --llm-provider local \
  --out ./generated.ideamark.yaml
```

The command should be allowed to create a session directory so intermediate slot matches, partial skeletons, diagnostics, and run metadata are inspectable.

### M1 fixed defaults

M1 can use fixed defaults that are later made configurable:

- `chunk_size`: approximately 2,000 to 4,000 tokens or equivalent character range;
- `chunk_overlap`: 20% to 30%;
- `candidate_threshold`: provisional and tuned during tests;
- `min_match_confidence`: provisional and tuned during tests;
- `dedup_strategy`: same family + same mapped slot + overlapping or nearby span;
- `section_strategy`: use Projection `decomposition_guidance.section_strategy` when available, otherwise group by completed skeleton match / source window;
- `entity_focus`: use Projection `decomposition_guidance.entity_focus` as a ranking and filtering hint when available.

### M1 Projection subset

The sample Projection Library shape is richer than M1 needs. For M1, POR should read only the subset necessary for practical extraction.

Required or useful M1 fields:

- `id`
- `title`
- `domain_hint`
- `purpose`
- `uses_skeleton_families`
- `uses_skeleton_families[].ref`
- `uses_skeleton_families[].slot_mapping`
- `decomposition_guidance.section_strategy`
- `decomposition_guidance.entity_focus`
- `retrieval_expectations.primary_match`
- `retrieval_expectations.expected_outputs`
- `evaluation_tests` as non-blocking notes

Fields such as `reconstruction_guidance` and full `evaluation_tests` should be preserved as metadata or notes, but M1 does not need to implement their full semantics.

The Projection Runtime should combine:

```text
Skeleton Family canonical_slots
  + Projection uses_skeleton_families[].slot_mapping
  + Projection domain_hint
  + Projection decomposition_guidance.entity_focus
  -> skeleton slot extraction tasks
```

### M1 Local LLM output schema

The local LLM should not generate an IdeaMark Document.

It should only answer small skeleton slot extraction tasks for a single chunk/window and a small set of family/slot targets.

Initial JSON output schema:

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
  "warnings": [
    {
      "code": "string",
      "message": "string"
    }
  ]
}
```

M1 may omit offsets when the local LLM cannot reliably return them, but POR should preserve chunk id and source text range so later deterministic anchoring remains possible.

### M1 Candidate assembly rule

M1 candidate assembly can be intentionally simple:

1. Collect slot matches from all overlapping chunks.
2. Deduplicate matches by source overlap, family, mapped slot, and text similarity.
3. Cluster compatible matches under the same family instance when they occur in nearby source windows or are linked by common slot expectations.
4. Compute a simple candidate score from confidence, duplicate support, slot coverage, and Projection focus.
5. Promote clusters above threshold to provisional reusable material candidates and role-bearing placement candidates.
6. Assemble rough Sections from source windows around promoted clusters.
7. Emit Core draft namespaces mechanically.
8. Run `ideamark-cli validate`.
9. Store diagnostics as review signals and, where possible, run localized LLM repair only for the failing field or candidate.

### M1 success criteria

M1 succeeds when:

- POR can process at least a few large text files without manual chunk preparation;
- POR can load a sample Projection using `uses_skeleton_families` and `slot_mapping`;
- local LLM calls remain small and slot-focused;
- extracted matches can be inspected before document assembly;
- rough `sources`, `sections`, `occurrences`, and `entities` are emitted;
- `ideamark-cli validate` runs on the emitted draft;
- diagnostics are stored and mapped back to source/candidate/session state;
- the generated document is good enough for human review and iterative improvement, even if not yet high-quality.

## Reuse vs. reset assessment

| Area | v0.1.0 value | v1.2.0 impact | v0.2.0 action |
| --- | --- | --- | --- |
| Stateful progressive engine | Still valid | Core explicitly allows progressive engines outside document validity | Reuse |
| Context-force-first interpretation | Still useful | Must be mapped to role-bearing Occurrence projections only at Core boundary | Reuse with clearer boundary |
| Retroactive reinterpretation | Still valid | Core can record outputs via statuses, revision metadata, and replacement relationships; scheduling remains POR-owned | Reuse |
| Entity emergence | Partially valid | Entity must mean Projection-shaped reusable material, not POR's early fragment candidate | Rename internal pre-entity objects and defer Entity creation |
| Section emergence | Partially valid | Section must be a Projection-shaped local source window | Redefine section projection as source-window construction |
| Occurrence projection | Still central | Occurrence is the primary final placement object | Promote to core output concern |
| YAML/frontmatter style dev spec | Outdated for v1.2.0 | Core v1.2.0 uses `meta` namespace instead of legacy frontmatter | Do not use as implementation output shape |
| CLI boundary | Still valid | v1.2.0 reinforces stateless CLI boundary | Reuse and make explicit |
| Skeleton graph | New emphasis | Core documents should not be forced to expose POR analysis graphs | Add as POR internal IR for context-force analysis |
| LLM execution backend | New operational concern | Core should not depend on a specific model or provider | Add provider abstraction for local and cloud LLMs |
| Source ingestion | Needs expansion | Original Source is not always plain text | Add source adapter boundary with text adapter first |
| Batch/app integration | New product concern | POR should become a reusable command for higher-level batch apps | Define CLI input contract for families, projections, adapters, and sources |

## Planning goals

1. Define POR v0.2.0 as a companion progressive authoring engine for IdeaMark Core v1.2.0.
2. Preserve POR's stateful session model while preventing runtime state from leaking into required Core documents.
3. Produce Core-compatible draft exports with `meta`, `sources`, `sections`, `occurrences`, and `entities`.
4. Treat Projection input as guidance for decomposition, source-window formation, occurrence roles, entity boundaries, traceability, uncertainty, and review priorities.
5. Keep `ideamark-cli` authoritative for stateless document validation, formatting, describe output, and export verification.
6. Use a POR-owned skeleton graph as an intermediate representation for context-force analysis, not as a required Core document structure.
7. Treat the npm-distributed `ideamark-cli` command surface as an external tool boundary that POR discovers and invokes rather than reimplementing.
8. Support configurable local and cloud LLM backends through a provider-neutral task interface.
9. Compile Projection guidance into executable skeleton graph matching keys so chunk-level analysis does not require sending the full Projection into every LLM prompt.
10. Provide a POR command that can generate IdeaMark Documents from Skeleton Families, one or more Projections, and adapter-normalized Original Sources.
11. Make POR usable as a lower-level generation command for future batch applications that gather many Original Sources and process them automatically.

## Key v0.2.0 design discussions

### POR command input model

POR should be designed as an installable command that generates IdeaMark Documents from three explicit inputs:

```text
Skeleton Family Library
  + Projection Set
  + Original Source via Source Adapter
  -> POR Session
  -> IdeaMark Core draft
  -> ideamark-cli validation
  -> IdeaMark Document
```

Skeleton Families provide default reusable structural families. POR should ship with an internal default Skeleton Family set, while allowing callers to provide additional external family libraries.

Projection input should be provided at execution time. A POR run may use one Projection or multiple Projections. The Projection Set does not replace Skeleton Families. Instead, it selects families, gives domain hints, tunes slot directionality, narrows match classes, defines ignored material, and sets review priorities.

Original Source input should be adapter-normalized. POR should not assume the source is a single text file. The first implementation can support a text adapter, but the boundary should be extensible to later adapters for plain text files, Markdown/documentation trees, GitHub repositories, PDFs, HTML/web captures, transcripts, video/audio sources after transcription, and mixed source bundles.

The command should be usable both directly by humans and indirectly by higher-level batch applications.

### Projection Runtime and skeleton-key matching

POR should not send the entire Projection into every chunk-level LLM prompt. Instead, the Projection Runtime should compile Projection guidance into a smaller set of executable skeleton graph matching keys.

The intended pipeline is:

```text
Projection
  -> Projection Runtime
  -> Skeleton Graph Key Set
  -> Chunk / Window Matching
  -> Partial Skeleton Graph State
  -> Skeleton Graph Analysis
  -> Prompt Builder
  -> LLM
```

In this model, Skeleton Graph Analysis is primarily a classification, matching, and state-combination stage.

It should perform iterative processing over overlapping chunks of the Original Source:

1. The source is split into windows with overlap so large inputs can be examined comprehensively.
2. For each chunk/window, POR uses the skeleton graph key set to identify portions of the source that appear to match Projection-derived structural expectations.
3. A match does not need to be complete inside the current chunk.
4. Partial matches are stored as unfinished skeleton graph fragments, open slots, pending edges, or unresolved candidate structures.
5. Later chunks are checked against both the key set and the saved partial state.
6. When enough support accumulates, partial structures can become candidate nodes or candidate edges.
7. Candidate structures remain provisional until stabilization, review, validation, or freeze policy promotes them toward Core-boundary output.

Recommended compiled key types:

- `structural_key`: expected graph shape, such as problem-evidence-measure, cause-effect, claim-support, or prerequisite-action.
- `role_key`: expected Occurrence role pressure, such as evidence, mechanism, risk, constraint, or target application.
- `boundary_key`: cues for entity boundary, section window boundary, or source-fragment grouping.
- `relation_key`: expected relation type or edge direction.
- `gap_key`: an expected missing part, such as evidence without conclusion, recommendation without target, or mechanism without condition.
- `negative_key`: material that should be ignored, rejected, or routed to review under the current Projection.

Recommended partial state types:

- `partial_match`: a matched subset of a skeleton key that lacks required support.
- `open_slot`: an expected graph element not yet found.
- `pending_edge`: a plausible relation awaiting confirmation from later context.
- `ambiguous_match`: a chunk span that matches multiple keys or roles.
- `stale_partial`: a partial match that has not received support after enough later windows.
- `completed_match`: a partial structure that now has sufficient support to become a candidate.

### Original Source adapters

POR should normalize all inputs through Source Adapters before chunking, matching, or LLM extraction.

The first required adapter should be `text`.

The `text` adapter should support:

- one local text file;
- stdin;
- explicit source id;
- character offsets;
- line offsets when available;
- stable chunk/window identifiers.

Future adapters should not change POR's downstream pipeline. They should produce the same normalized source representation:

```text
Original Source
  -> Source Adapter
  -> source_record
  -> source_unit
  -> chunk/window
  -> source_fragment_node
```

Adapter output should include `source_id`, `source_uri`, `source_media_type`, `source_adapter`, `source_unit_id`, text or transcript payload when available, anchors, extraction metadata, and warnings.

### Using npm-distributed `ideamark-cli`

POR should assume `ideamark-cli` is installed as a normal package dependency or runtime dependency, for example via:

```bash
npm i ideamark-cli
```

POR should then invoke the installed command surface instead of importing unstable internal modules.

Required command interactions:

- `describe capabilities --format json`: discover supported commands, topics, formats, options, and language/routing features.
- `describe ai-authoring --format md|json`: retrieve authoring guidance for human/LLM prompt construction.
- `describe params --format json`: retrieve required fields, ID rules, vocabulary hints, and generation parameters.
- `validate --format ndjson|json <input>`: validate draft exports and collect diagnostics.

POR should cache `describe` results per CLI version and document spec version. Cache invalidation should occur when the installed CLI version changes, when `describe capabilities` changes, or when the user forces refresh.

### Local and cloud LLM execution

POR should support LLM execution as a configurable backend rather than a built-in assumption.

Recommended abstraction:

```ts
type LlmTaskKind =
  | "skeleton_slot_extraction"
  | "context_force_extraction"
  | "candidate_boundary_proposal"
  | "placement_role_proposal"
  | "source_window_proposal"
  | "retroactive_reinterpretation"
  | "diagnostic_repair_plan"
  | "review_summary";

type LlmEndpointKind = "local" | "cloud" | "mock";
```

The LLM should remain advisory. For M1, local LLM usage should focus on `skeleton_slot_extraction` and limited localized repair only.

## Core boundary principles

POR v0.2.0 MUST maintain a hard boundary between internal state and Core documents.

### POR-owned internal state

POR may store and update:

- source ingestion state;
- source adapter metadata, source records, source units, anchors, and adapter warnings;
- chunking and scheduling state;
- Skeleton Family registry state and selected family set;
- Projection Runtime outputs, skeleton graph keys, and matching rules;
- skeleton graph nodes, edges, snapshots, partial matches, open slots, and graph query results;
- candidate scores;
- review queues;
- LLM prompt plans, provider selections, and model outputs;
- `ideamark-cli` describe cache, validation diagnostics, command metadata, and retry metadata.

This state is not required for Core document validity.

### Core-boundary output

When POR exports or hands off to `ideamark-cli`, it should emit or synthesize:

- `meta` with `spec_version: ideamark-core-v1.2.0`, document identity, status, optional profile / Projection references, and generation metadata;
- `sources` derived from Original Source references;
- `sections` as Projection-shaped local source windows with ordered Occurrence references;
- `occurrences` as role-bearing placements with `entity`, `role`, anchors, rationale, confidence, and status when available;
- `entities` as reusable material with `content`, `payload`, or `ref`.

POR-specific state may be preserved only through declared extensions, companion files, or session storage, not as required Core fields.

## v0.2.0 conceptual model

| Layer | POR internal object | Core-boundary counterpart |
| --- | --- | --- |
| Command invocation | `generate_request`, `batch_manifest`, `run_config` | Generation metadata only |
| Skeleton library | `skeleton_family_library`, `skeleton_family`, `family_selection` | Optional references / generation metadata |
| Projection set | `projection_set`, `projection_runtime_plan`, `skeleton_key`, `matching_rule`, `gap_expectation`, `negative_route` | Projection/profile references and generation metadata only |
| Source adaptation | `source_adapter`, `source_record`, `source_unit`, `adapter_anchor`, `adapter_warning` | `sources`, Section / Occurrence anchors |
| Source ingestion | `chunk`, `fragment`, `window` | Section / Occurrence anchors |
| Skeleton extraction | `slot_extraction_task`, `slot_match`, `slot_match_cluster` | Candidate decisions and optional diagnostics |
| Skeleton graph | `skeleton_node`, `skeleton_edge`, `partial_match`, `open_slot`, `graph_snapshot`, `graph_query_result` | Session-only state, optional diagnostics / evidence, candidate decisions |
| Candidate construction | `reusable_material_candidate`, `placement_candidate`, `source_window_candidate` | `entities`, `occurrences`, `sections` |
| Handoff | `draft_state`, `export_plan` | IdeaMark Core v1.2.0 document validated by `ideamark-cli` |
| LLM execution | `llm_task`, `llm_provider`, `prompt_plan`, `model_output` | Advisory slot extraction and repair hints only |

## Proposed module updates

### M1 required modules

- `por_generate_command`: primary command entrypoint.
- `projection_loader`: loads a Projection file or selected Projection from a library.
- `skeleton_family_registry`: loads built-in default Skeleton Families.
- `family_selection_resolver`: resolves active families from Projection `uses_skeleton_families`.
- `projection_runtime_compiler`: compiles active family slots and slot mappings into extraction tasks.
- `text_source_adapter`: converts a text file or stdin into source records and chunks.
- `chunk_window_iterator`: produces overlapping chunk windows.
- `llm_provider_registry`: resolves local provider for extraction.
- `prompt_context_builder`: builds small slot extraction prompts.
- `llm_output_guard`: validates local LLM JSON outputs.
- `slot_match_store`: stores extraction outputs.
- `slot_match_clusterer`: deduplicates and clusters matches.
- `candidate_builder`: builds provisional reusable material, placement, and source-window candidates.
- `core_draft_assembler`: mechanically emits rough Core draft namespaces.
- `ideamark_cli_command_resolver`: resolves installed `ideamark-cli`.
- `cli_validation_handoff`: validates generated draft and records diagnostics.

### Later modules

- `source_adapter_registry` for non-text adapters.
- `batch_manifest_loader` for multi-source applications.
- `partial_match_reconciler` for richer cross-window graph state.
- `graph_snapshot_manager` for detailed reinterpretation history.
- `diagnostic_repair_planner` for localized repair.
- `github_repo_source_adapter`, `pdf_source_adapter`, `html_source_adapter`, `transcript_source_adapter`, and media adapters.

## Initial implementation phases

### Phase 0 — M1 contract freeze

Deliverables:

- Define M1 command contract.
- Define M1 Projection subset.
- Define M1 local LLM output JSON schema.
- Define M1 text adapter output shape.
- Define M1 fixed chunk/window defaults.
- Define M1 candidate threshold configuration placeholders.

Exit criteria:

- A developer can implement M1 without needing the full future POR design.

### Phase 1 — Text source and Projection loading

Deliverables:

- `text_source_adapter`.
- Projection loader for sample Projection Library style YAML.
- Built-in Skeleton Family registry.
- Family selection from `uses_skeleton_families`.
- Slot extraction task generation from `slot_mapping`.

Exit criteria:

- POR can list which family/slot extraction tasks will be run for a given text + Projection.

### Phase 2 — Local LLM slot extraction

Deliverables:

- Fixed chunk/window iterator.
- Local LLM provider configuration.
- Slot extraction prompt builder.
- JSON output guard.
- Slot match store.

Exit criteria:

- POR can run local LLM extraction over a large text and store slot matches.

### Phase 3 — Candidate assembly and Core draft

Deliverables:

- Match deduplication.
- Simple clustering.
- Candidate scoring.
- Rough Section / Occurrence / Entity assembly.
- Core draft writer.

Exit criteria:

- POR can emit a rough IdeaMark Core draft from extracted slot matches.

### Phase 4 — CLI validation and inspection

Deliverables:

- `ideamark-cli` command resolver.
- `validate` handoff.
- Diagnostic storage.
- Report command or summary output showing matches, candidates, and validation result.

Exit criteria:

- A generated draft can be validated and reviewed.

## Open questions

1. What exact built-in Skeleton Family version should M1 package?
2. Should M1 accept a Projection Library file plus `--projection-id`, or only a single Projection file?
3. What local LLM endpoint should be the first supported default: Ollama-compatible HTTP, LM Studio-compatible OpenAI API, or generic OpenAI-compatible local endpoint?
4. Should offsets be required in local LLM output, or should POR derive offsets by searching `span_text` inside the chunk?
5. What initial candidate threshold should be used for tests?
6. What minimal Core draft shape should M1 emit when a candidate has only partial slot coverage?
7. Should M1 fail if `ideamark-cli validate` fails, or emit the draft plus diagnostics for review?
8. How much extraction evidence should be embedded in the output document versus kept in the POR session directory?

## Recommended next artifact

The next document should be `docs/dev/v0.2.0/por-m1-text-to-ideamark.md`.

It should turn this plan into an implementation-oriented milestone spec with:

- exact command examples;
- M1 Projection subset schema;
- M1 local LLM output JSON schema;
- M1 text adapter output schema;
- chunk/window defaults;
- candidate scoring placeholders;
- rough Core draft assembly rules;
- validation handoff behavior;
- a simple end-to-end test scenario.
