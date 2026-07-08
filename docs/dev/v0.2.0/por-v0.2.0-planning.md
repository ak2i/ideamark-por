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

Original Source input should be adapter-normalized. POR should not assume the source is a single text file. The first implementation can support a text adapter, but the boundary should be extensible to later adapters for:

- plain text files;
- Markdown / documentation trees;
- GitHub repositories containing source code and documentation;
- PDFs;
- HTML / web captures;
- transcripts;
- video or audio sources after transcription and segmentation;
- mixed source bundles.

The command should be usable both directly by humans and indirectly by higher-level batch applications. A future app should be able to collect Original Sources from a list, choose Projection Sets, call POR repeatedly, and store generated IdeaMark Documents without reimplementing POR internals.

A possible command shape is:

```bash
ideamark-por generate \
  --source ./source.txt \
  --source-adapter text \
  --projection ./projection.yaml \
  --skeleton-family default \
  --out ./out.ideamark.yaml
```

For future batch use, POR should also support manifest-driven execution:

```bash
ideamark-por generate \
  --manifest ./por-batch-manifest.yaml \
  --out-dir ./generated
```

The manifest format can later represent multiple sources, multiple Projection Sets, adapter options, provider options, and output routing.

### Skeleton graph for context-force analysis

The skeleton graph should be introduced as a POR internal analysis graph.

Its purpose is to make context force observable before POR commits to Core-boundary `sections`, `occurrences`, and `entities`.

The skeleton graph is not the final IdeaMark graph. It is a provisional, force-oriented structure used to answer questions such as:

- which source fragments exert pressure toward the same reusable material candidate;
- which role-bearing placements are competing for the same source material;
- which Projection constraints are shaping entity boundaries;
- which local source windows are stable enough to become Core Sections;
- which later fragments retroactively change the interpretation of earlier placements;
- which candidate structures are under-supported, over-broad, or internally conflicted.

Recommended skeleton graph node types:

- `source_fragment_node`: chunk or fragment derived from an Original Source;
- `context_force_node`: an observed interpretive pressure such as problem framing, evidence pressure, contrast, dependency, temporal ordering, or reuse pressure;
- `projection_constraint_node`: a constraint or preference loaded from Projection/profile guidance;
- `reusable_material_candidate_node`: a pre-Core Entity candidate;
- `placement_candidate_node`: a pre-Core Occurrence candidate;
- `source_window_candidate_node`: a pre-Core Section candidate;
- `review_signal_node`: a diagnostic, conflict, uncertainty, or human review marker.

Recommended edge types:

- `supports_candidate`
- `competes_with`
- `refines_boundary`
- `requires_context`
- `anchors_to_source`
- `belongs_to_window`
- `role_pressure`
- `projection_pressure`
- `retroactively_reinterprets`
- `needs_review`

The key design point is that context force should be analyzed on this graph before producing Core objects. Core-boundary output should receive only stabilized results: Entity material, Occurrence placement, Section windows, anchors, rationale, status, and confidence. The raw graph may remain in session storage or be emitted as optional diagnostics / evidence, but it must not become a required Core namespace.

### Projection Runtime and skeleton-key matching

POR should not send the entire Projection into every chunk-level LLM prompt. That is too complex, unstable, and expensive for large-source iteration.

Instead, the Projection Runtime should compile Projection guidance into a smaller set of executable skeleton graph matching keys.

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

The skeleton graph therefore acts like a classification key, not merely a generated graph. It lets POR ask:

- does this chunk contain material that fits any Projection-derived skeleton pattern;
- does this chunk complete or strengthen an unfinished partial skeleton from a prior chunk;
- does this chunk conflict with a previously inferred skeleton fragment;
- does this chunk suggest that an existing candidate boundary is too narrow or too broad;
- does this chunk create evidence for a new source window, role-bearing placement, or reusable material candidate.

This design preserves the main value of Projection while reducing prompt complexity. Projection is executed by the Projection Runtime as graph keys, matching rules, and state transitions. The LLM receives narrower prompts that ask it to inspect specific chunk material, explain ambiguous matches, propose repairs, or interpret only the relevant partial graph context.

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

This should be treated as the central reason to use POR instead of one-shot LLM generation: POR can scan large sources through Projection-derived skeleton keys while carrying forward incomplete structures across overlapping windows.

### Original Source adapters

POR should normalize all inputs through Source Adapters before chunking, matching, or LLM extraction.

A Source Adapter is responsible for converting an input source into adapter-neutral source records and fragments. It should preserve enough anchors for later Core output and review.

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

Adapter output should include:

- `source_id`
- `source_uri`
- `source_media_type`
- `source_adapter`
- `source_unit_id`
- `text_or_transcript_payload` when available
- anchors such as path, line range, character range, page range, timestamp range, or repository object reference
- extraction metadata and warnings

Future adapter examples:

- `github_repo`: clone or read a repository, select files, classify code/docs, and emit file-based source units.
- `pdf`: extract page text, page anchors, and optionally figure/table placeholders.
- `html`: extract main text, headings, links, and DOM-ish anchors.
- `transcript`: ingest precomputed transcript segments with timestamps.
- `video`: delegate transcription/scene extraction, then emit transcript and media-time anchors.

This makes POR useful as a foundation for later applications that gather Original Source sets automatically, then call POR as the generation engine.

### Using npm-distributed `ideamark-cli`

POR should assume `ideamark-cli` is installed as a normal package dependency or runtime dependency, for example via:

```bash
npm i ideamark-cli
```

POR should then invoke the installed command surface instead of importing unstable internal modules.

The exact binary name should be resolved by configuration or package metadata. The planning assumption is that POR can call the installed command, whether the executable is exposed as `ideamark`, `ideamark-cli`, or another declared bin name.

Required command interactions:

- `describe capabilities --format json`: discover supported commands, topics, formats, options, and language/routing features.
- `describe ai-authoring --format md|json`: retrieve authoring guidance for human/LLM prompt construction.
- `describe params --format json`: retrieve required fields, ID rules, vocabulary hints, and generation parameters.
- `validate --format ndjson|json <input>`: validate draft exports and collect diagnostics.

POR should cache `describe` results per CLI version and document spec version. Cache invalidation should occur when the installed CLI version changes, when `describe capabilities` changes, or when the user forces refresh.

Design constraints:

- POR must not duplicate canonical validation rules from `ideamark-cli`.
- POR may perform early local checks, but final document validity belongs to `ideamark-cli`.
- POR should preserve the full validation diagnostics in session state.
- POR should convert diagnostics into review tasks, regeneration hints, or skeleton graph review signals.
- POR should keep command execution deterministic and auditable by recording command, version, input file hash, exit code, and diagnostic summary.

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

The POR engine should route tasks to a provider registry:

- Local LLMs: useful for private source material, low-cost iteration, offline work, and repeatable development.
- Cloud LLMs: useful for stronger reasoning, larger context windows, multimodal support, or difficult repair planning.
- Mock/deterministic providers: useful for tests, regression fixtures, CI, and golden sample evaluation.

Provider configuration should include:

- endpoint kind and provider name;
- model identifier;
- context length / token limits;
- structured-output support;
- temperature and reproducibility settings;
- privacy classification allowed for the provider;
- timeout and retry policy;
- cost / quota budget when relevant.

The LLM should remain advisory. It may extract skeleton slots from local chunks, propose context forces, skeleton graph nodes, candidate boundaries, role assignments, or repair plans, but the POR engine owns session state, scoring, freeze policy, document assembly, and export decisions.

### Additional required issues

The following topics should be treated as first-class v0.2.0 planning items:

1. Session storage shape: JSON files are faster for early iteration, but SQLite is likely better once skeleton graph queries, diagnostic history, and retroactive reinterpretation are needed.
2. Skeleton graph query model: define minimum graph queries needed before choosing a graph database or custom tables.
3. CLI compatibility matrix: record which `ideamark-cli` versions are compatible with POR v0.2.0 and which Core spec versions they describe / validate.
4. Prompt construction pipeline: prompts should be built from Projection/profile hints, `describe ai-authoring`, source fragments, and current skeleton graph state.
5. Diagnostic feedback loop: validation diagnostics should become structured POR review signals, not just console output.
6. Privacy and provider policy: local/cloud LLM routing must respect source sensitivity and user configuration.
7. Evaluation fixtures: define small golden sources where expected skeleton graph and Core draft behavior can be regression-tested.
8. Failure modes: handle missing CLI, incompatible CLI, unavailable LLM endpoint, malformed LLM output, partial validation output, and interrupted sessions.
9. Projection Runtime compilation: define how Projection is converted into skeleton graph keys, matching rules, gap expectations, and negative routing rules.
10. Partial-match lifecycle: define how unfinished skeleton fragments are created, refreshed, completed, expired, merged, split, or sent to review.
11. Source adapter contract: define what every adapter must emit so POR can process text, repositories, PDFs, transcripts, and future media uniformly.
12. Batch manifest contract: define how higher-level applications can provide lists of sources, Projection Sets, adapter settings, output locations, and provider settings.

## Core boundary principles

POR v0.2.0 MUST maintain a hard boundary between internal state and Core documents.

### POR-owned internal state

POR may store and update:

- source ingestion state;
- source adapter metadata, source records, source units, anchors, and adapter warnings;
- chunking and scheduling state;
- context-force hypotheses;
- Skeleton Family registry state and selected family set;
- Projection Runtime outputs, skeleton graph keys, and matching rules;
- skeleton graph nodes, edges, snapshots, partial matches, open slots, and graph query results;
- retroactive reinterpretation history;
- force traces and force clusters;
- candidate scores;
- plastic / frozen state;
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

POR v0.2.0 should distinguish the following layers.

| Layer | POR internal object | Core-boundary counterpart |
| --- | --- | --- |
| Command invocation | `generate_request`, `batch_manifest`, `run_config` | Generation metadata only |
| Skeleton library | `skeleton_family_library`, `skeleton_family`, `family_selection` | Optional references / generation metadata |
| Projection set | `projection_set`, `projection_runtime_plan`, `skeleton_key`, `matching_rule`, `gap_expectation`, `negative_route` | Projection/profile references and generation metadata only |
| Source adaptation | `source_adapter`, `source_record`, `source_unit`, `adapter_anchor`, `adapter_warning` | `sources`, Section / Occurrence anchors |
| Source ingestion | `chunk`, `fragment`, `window` | Section / Occurrence anchors |
| Interpretation | `context_force_hypothesis`, `retro_force_hypothesis` | Occurrence rationale, status, confidence, optional extension diagnostics |
| Skeleton graph | `skeleton_node`, `skeleton_edge`, `partial_match`, `open_slot`, `graph_snapshot`, `graph_query_result` | Session-only state, optional diagnostics / evidence, candidate decisions |
| Reconciliation | `force_trace`, `force_cluster`, `support_signal`, `transition_signal` | Entity boundary decisions, Occurrence role decisions, Section source-window decisions |
| Candidate construction | `reusable_material_candidate`, `placement_candidate`, `source_window_candidate` | `entities`, `occurrences`, `sections` |
| Stabilization | `selection_state`, `freeze_state`, review queues | Core status fields, generation metadata, optional companion diagnostics |
| Handoff | `draft_state`, `export_plan` | IdeaMark Core v1.2.0 document validated by `ideamark-cli` |
| Tooling integration | `cli_command_resolution`, `describe_cache`, `validation_run` | External CLI command invocation and diagnostics |
| LLM execution | `llm_task`, `llm_provider`, `prompt_plan`, `model_output` | Advisory slot extraction and repair hints only |

## Proposed module updates

v0.2.0 should revise the v0.1.0 module list as follows.

### Keep from v0.1.0

- `segment_interpreter`
- `context_force_extractor`
- `explicit_entity_cue_extractor`
- `force_normalizer`
- `force_registry`
- `overlap_resolver`
- `window_builder`
- `forward_reconciler`
- `retro_reconciler`
- `force_trace_builder`
- `force_cluster_builder`
- `support_aggregator`
- `transition_analyzer`
- `confidence_evaluator`
- `state_updater`
- `freeze_controller`

### Rename or refocus

- `emergent_entity_builder` becomes `reusable_material_candidate_builder`.
- `occurrence_projection_builder` becomes `role_bearing_placement_builder`.
- `section_emergence_builder` becomes `source_window_section_builder`.
- `draft_state_emitter` becomes `core_draft_emitter`.
- `synthesis_adapter` becomes `ideamark_core_export_adapter`.

### Add for v1.2.0 alignment

- `projection_context_loader`: loads Projection/profile hints that guide decomposition and role vocabulary without making Projection internals part of POR.
- `source_anchor_manager`: normalizes anchors and validates source references before export.
- `core_boundary_mapper`: maps internal candidates to `meta`, `sources`, `sections`, `occurrences`, and `entities`.
- `cli_validation_handoff`: calls `ideamark-cli validate`, `describe`, or related stateless commands and records diagnostics.
- `extension_policy_manager`: decides what POR-specific metadata may be emitted as declared extensions vs. kept in session state only.

### Add for POR command, source adapters, Projection Runtime, skeleton graph, and execution backends

- `por_generate_command`: provides the primary command entrypoint for Source + Projection Set + Skeleton Family generation.
- `batch_manifest_loader`: loads a manifest containing multiple sources, projections, adapter settings, output settings, and provider settings.
- `skeleton_family_registry`: loads built-in default Skeleton Families and optional external family libraries.
- `family_selection_resolver`: resolves which Skeleton Families are active for a run based on Projection Set and command options.
- `source_adapter_registry`: resolves source adapters by media type, command option, or manifest entry.
- `text_source_adapter`: first adapter that converts text files or stdin into source records, units, chunks, and anchors.
- `source_unit_normalizer`: converts adapter-specific source units into POR-neutral source records and fragments.
- `projection_runtime_compiler`: compiles Projection/profile guidance into skeleton graph keys, matching rules, gap expectations, and negative routing rules.
- `skeleton_key_registry`: stores compiled keys and tracks which keys produced matches, partials, or review signals.
- `chunk_window_iterator`: produces overlapping chunk windows for comprehensive source traversal.
- `skeleton_matcher`: matches current chunks against skeleton keys and existing partial state.
- `partial_match_store`: stores unfinished skeleton fragments, open slots, pending edges, ambiguous matches, stale partials, and completed matches.
- `partial_match_reconciler`: combines new chunk evidence with existing partial skeleton graph state.
- `skeleton_graph_builder`: creates and updates the internal graph from fragments, force hypotheses, Projection constraints, and candidates.
- `context_force_graph_analyzer`: runs graph queries to identify pressure zones, boundary conflicts, weak candidates, and retroactive reinterpretation triggers.
- `graph_snapshot_manager`: records graph snapshots so reinterpretation can be explained and compared over time.
- `ideamark_cli_command_resolver`: resolves the installed `ideamark-cli` binary and records command metadata.
- `cli_describe_cache`: caches `describe capabilities`, `describe params`, and `describe ai-authoring` outputs by CLI/document version.
- `llm_provider_registry`: manages local, cloud, and mock LLM providers.
- `llm_task_router`: routes POR task kinds to configured providers based on capability, privacy, cost, and fallback rules.
- `prompt_context_builder`: builds prompts from Projection/profile hints, CLI describe guidance, source fragments, skeleton keys, partial matches, and graph state.
- `llm_output_guard`: validates and normalizes structured LLM outputs before they affect session state.

## Initial implementation phases

### Phase 0 — Spec, CLI, and execution alignment

Deliverables:

- Keep `docs/dev/v0.1.0` as historical reference.
- Add `docs/dev/v0.2.0` as the active planning line.
- Write the v0.2.0 architecture plan and Core boundary mapping.
- Identify required CLI contract assumptions for Core v1.2.0 validation.
- Define how POR installs, resolves, and invokes the npm-distributed `ideamark-cli` command.
- Define the initial LLM provider configuration model for local, cloud, and mock execution.
- Define Projection Runtime responsibilities and the first skeleton key schema.
- Define POR command inputs: Skeleton Family Library, Projection Set, Source Adapter, Original Source, output target, and run configuration.

Exit criteria:

- The team agrees that v0.2.0 is the active development baseline for Core v1.2.0.
- No v0.2.0 document claims POR owns Core document validity rules.
- POR has a documented CLI command discovery and validation handoff strategy.
- POR has a documented LLM provider boundary and does not assume one hardcoded model.
- POR has a documented Projection-to-skeleton-key compilation boundary.
- POR has a documented generation command contract suitable for later batch applications.

### Phase 1 — Session, source adapter, and source model

Deliverables:

- Session schema for sources, chunks, fragments, hypotheses, candidate states, diagnostics, and export plans.
- Source Adapter interface and first `text_source_adapter`.
- Source anchor representation compatible with Core v1.2.0 anchor expectations.
- Basic `por init`, `por status`, source registration flow, and `por generate --source-adapter text` flow.
- Initial storage choice for session state and skeleton graph snapshots.
- Partial-match state schema for unfinished skeleton fragments and open slots.

Exit criteria:

- POR can represent Original Sources and incremental ingestion state without producing Core objects prematurely.
- POR can ingest a text source through the same adapter contract future non-text sources will use.
- POR can preserve command metadata, adapter metadata, LLM task metadata, and diagnostics as session state.
- POR can store partial skeleton matches independently from final Core candidates.

### Phase 2 — Projection Runtime, skeleton graph, and candidate pipeline

Deliverables:

- Built-in default Skeleton Family registry.
- Projection Set loading and family selection.
- Projection Runtime compiler for initial skeleton key types.
- Context-force extraction and normalization interfaces.
- Overlapping chunk/window iterator.
- Skeleton graph node / edge model.
- Skeleton key matching and partial-match reconciliation.
- Minimum graph query set for context-force analysis.
- Force trace / cluster state model.
- Candidate builders for reusable material, role-bearing placements, and source-window Sections.
- LLM task interface for local skeleton slot extraction and limited repair.

Exit criteria:

- POR can compile Projection guidance into skeleton graph keys using selected Skeleton Families.
- POR can iterate over overlapping text chunks and collect both complete and partial skeleton matches.
- POR can combine later chunk evidence with saved partial skeleton graph state.
- POR can derive provisional candidate graphs from skeleton graph analysis without prematurely committing to Core objects.

### Phase 3 — CLI-guided Core draft export

Deliverables:

- `core_boundary_mapper` that emits Core v1.2.0 draft structure.
- `ideamark_core_export_adapter` for file output.
- `ideamark_cli_command_resolver` for installed command discovery.
- `cli_describe_cache` for capability / params / ai-authoring guidance.
- `cli_validation_handoff` for validation diagnostics.
- Initial localized repair loop for validation diagnostics.

Exit criteria:

- A POR session can emit a draft with required `meta`, `sources`, `sections`, `occurrences`, and `entities` namespaces.
- The draft can be passed to the installed `ideamark-cli validate` command in Core mode.
- Validation diagnostics are stored and converted into review signals or localized repair tasks.

### Phase 4 — Review and stabilization loop

Deliverables:

- Review queue driven by validation diagnostics, low-confidence candidates, unresolved references, unknown role warnings, partial-match gaps, and skeleton graph conflicts.
- Freeze / unfreeze policies aligned with Core status output.
- Regeneration metadata and replacement notes where useful.
- Diagnostic repair planning through configured LLM providers.

Exit criteria:

- POR can revise candidate structures without losing history and can export updated Core-compatible drafts.
- POR can explain why a candidate was frozen, reopened, merged, split, or rejected.
- POR can explain which skeleton key and chunk/window evidence led to a candidate.

### Phase 5 — Provider, adapter, and fixture hardening

Deliverables:

- Local/cloud/mock LLM provider adapters.
- Golden sample fixtures for source ingestion, text adapter behavior, skeleton key compilation, chunk matching, skeleton graph formation, CLI validation, and repair loops.
- Provider privacy policy checks.
- Failure-mode tests for missing CLI, incompatible CLI, unavailable LLM endpoint, malformed LLM output, source adapter warnings, and interrupted sessions.
- Adapter design notes for GitHub repository, PDF, HTML, transcript, and video/audio source expansion.

Exit criteria:

- The same fixture can run with a mock provider in CI and with configured local/cloud providers during development.
- POR can fail gracefully when external CLI, LLM, or source adapter dependencies are unavailable.
- Future non-text adapters can be added without changing the downstream Projection Runtime / Skeleton Graph / Core draft pipeline.

## Open questions

1. Should v0.2.0 store POR session state in SQLite from the first milestone, or begin with JSON session files for faster iteration?
2. Which subset of Core v1.2.0 anchor types should POR support first?
3. How should Projection/profile hints be represented locally before the official CLI fully supports v1.2.0 describe output?
4. Which POR metadata deserves declared extension output, and which must remain session-only?
5. Should role vocabulary be Projection-provided, document-local, or initially use the recommended Core v1.2.0 role vocabulary?
6. What is the minimum useful skeleton graph model for v0.2.0: force/candidate graph only, or source/candidate/review graph from the start?
7. Should skeleton graph snapshots be stored as append-only history, mutable current state plus audit log, or both?
8. Which installed CLI binary name should POR prefer when `ideamark-cli` exposes multiple commands?
9. Should POR install `ideamark-cli` as a direct dependency, peer dependency, or externally managed runtime dependency?
10. Which LLM tasks are allowed to use cloud providers by default, and which require explicit user opt-in?
11. What structured-output schema should LLM providers return for graph updates and candidate proposals?
12. How should POR compare outputs across local/cloud/mock providers for regression and evaluation?
13. What is the minimum skeleton key schema that can represent Projection-derived matching without becoming a second Projection language?
14. Should skeleton key matching be deterministic first, LLM-assisted first, or hybrid from the first milestone?
15. How should overlapping window results be deduplicated when the same skeleton key matches adjacent chunks?
16. When should a partial match expire, and when should it remain open until the end of the source?
17. How should negative keys suppress irrelevant matches without hiding unexpected useful material?
18. What should be the stable Source Adapter output contract shared by text, GitHub repository, PDF, transcript, and future media adapters?
19. Should `ideamark-por generate` accept multiple Projections directly, or only a Projection Set file that contains multiple Projection references?
20. Should the built-in Skeleton Family Library be versioned independently from POR, or tied to the POR package version?
21. What minimum batch manifest schema is needed for a higher-level app to gather many Original Sources and invoke POR repeatedly?
22. How should source acquisition responsibility be split between a higher-level batch app and POR itself?

## Recommended next artifact

The next document should be `docs/dev/v0.2.0/por-engine-architecture-v0.2.md`.

It should turn this plan into a module-level architecture with:

- data model sketches;
- POR command input contract;
- Source Adapter interface and first text adapter;
- built-in Skeleton Family registry and external family loading;
- Projection Set loading and family selection;
- Projection Runtime and skeleton key compilation flow;
- skeleton graph schema and graph query examples;
- chunk/window iteration and partial-match lifecycle;
- command surface assumptions;
- `ideamark-cli` install / discovery / validation handoff flow;
- LLM provider registry and task routing model;
- Core v1.2.0 export examples;
- validation handoff flow;
- batch manifest assumptions for future applications;
- non-goals for v0.2.0.
