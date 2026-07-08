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

## Planning goals

1. Define POR v0.2.0 as a companion progressive authoring engine for IdeaMark Core v1.2.0.
2. Preserve POR's stateful session model while preventing runtime state from leaking into required Core documents.
3. Produce Core-compatible draft exports with `meta`, `sources`, `sections`, `occurrences`, and `entities`.
4. Treat Projection input as guidance for decomposition, source-window formation, occurrence roles, entity boundaries, traceability, uncertainty, and review priorities.
5. Keep `ideamark-cli` authoritative for stateless document validation, formatting, describe output, and export verification.
6. Use a POR-owned skeleton graph as an intermediate representation for context-force analysis, not as a required Core document structure.
7. Treat the npm-distributed `ideamark-cli` command surface as an external tool boundary that POR discovers and invokes rather than reimplementing.
8. Support configurable local and cloud LLM backends through a provider-neutral task interface.

## Key v0.2.0 design discussions

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

The LLM should remain advisory. It may propose context forces, skeleton graph nodes, candidate boundaries, role assignments, or repair plans, but the POR engine owns session state, scoring, freeze policy, and export decisions.

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

## Core boundary principles

POR v0.2.0 MUST maintain a hard boundary between internal state and Core documents.

### POR-owned internal state

POR may store and update:

- source ingestion state;
- chunking and scheduling state;
- context-force hypotheses;
- skeleton graph nodes, edges, snapshots, and graph query results;
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
| Source ingestion | `source_record`, `chunk`, `fragment` | `sources`, Section / Occurrence anchors |
| Interpretation | `context_force_hypothesis`, `retro_force_hypothesis` | Occurrence rationale, status, confidence, optional extension diagnostics |
| Skeleton graph | `skeleton_node`, `skeleton_edge`, `graph_snapshot`, `graph_query_result` | Session-only state, optional diagnostics / evidence, candidate decisions |
| Reconciliation | `force_trace`, `force_cluster`, `support_signal`, `transition_signal` | Entity boundary decisions, Occurrence role decisions, Section source-window decisions |
| Candidate construction | `reusable_material_candidate`, `placement_candidate`, `source_window_candidate` | `entities`, `occurrences`, `sections` |
| Stabilization | `selection_state`, `freeze_state`, review queues | Core status fields, generation metadata, optional companion diagnostics |
| Handoff | `draft_state`, `export_plan` | IdeaMark Core v1.2.0 document validated by `ideamark-cli` |
| Tooling integration | `cli_command_resolution`, `describe_cache`, `validation_run` | External CLI command invocation and diagnostics |
| LLM execution | `llm_task`, `llm_provider`, `prompt_plan`, `model_output` | Advisory candidate proposals and repair hints only |

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

### Add for skeleton graph and execution backends

- `skeleton_graph_builder`: creates and updates the internal graph from fragments, force hypotheses, Projection constraints, and candidates.
- `context_force_graph_analyzer`: runs graph queries to identify pressure zones, boundary conflicts, weak candidates, and retroactive reinterpretation triggers.
- `graph_snapshot_manager`: records graph snapshots so reinterpretation can be explained and compared over time.
- `ideamark_cli_command_resolver`: resolves the installed `ideamark-cli` binary and records command metadata.
- `cli_describe_cache`: caches `describe capabilities`, `describe params`, and `describe ai-authoring` outputs by CLI/document version.
- `llm_provider_registry`: manages local, cloud, and mock LLM providers.
- `llm_task_router`: routes POR task kinds to configured providers based on capability, privacy, cost, and fallback rules.
- `prompt_context_builder`: builds prompts from Projection/profile hints, CLI describe guidance, source fragments, and skeleton graph state.
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

Exit criteria:

- The team agrees that v0.2.0 is the active development baseline for Core v1.2.0.
- No v0.2.0 document claims POR owns Core document validity rules.
- POR has a documented CLI command discovery and validation handoff strategy.
- POR has a documented LLM provider boundary and does not assume one hardcoded model.

### Phase 1 — Session and source model

Deliverables:

- Session schema for sources, chunks, fragments, hypotheses, candidate states, diagnostics, and export plans.
- Source anchor representation compatible with Core v1.2.0 anchor expectations.
- Basic `por init`, `por status`, and source registration flow.
- Initial storage choice for session state and skeleton graph snapshots.

Exit criteria:

- POR can represent Original Sources and incremental ingestion state without producing Core objects prematurely.
- POR can preserve command metadata, LLM task metadata, and diagnostics as session state.

### Phase 2 — Skeleton graph and candidate pipeline

Deliverables:

- Context-force extraction and normalization interfaces.
- Skeleton graph node / edge model.
- Minimum graph query set for context-force analysis.
- Force trace / cluster state model.
- Candidate builders for reusable material, role-bearing placements, and source-window Sections.
- LLM task interface for proposing forces, boundaries, placements, and source windows.

Exit criteria:

- POR can produce provisional skeleton graphs from chunks while preserving uncertainty and reinterpretation history.
- POR can derive provisional candidate graphs from skeleton graph analysis without prematurely committing to Core objects.

### Phase 3 — CLI-guided Core draft export

Deliverables:

- `core_boundary_mapper` that emits Core v1.2.0 draft structure.
- `ideamark_core_export_adapter` for file output.
- `ideamark_cli_command_resolver` for installed command discovery.
- `cli_describe_cache` for capability / params / ai-authoring guidance.
- `cli_validation_handoff` for validation diagnostics.

Exit criteria:

- A POR session can emit a draft with required `meta`, `sources`, `sections`, `occurrences`, and `entities` namespaces.
- The draft can be passed to the installed `ideamark-cli validate` command in Core mode.
- Validation diagnostics are stored and converted into review signals.

### Phase 4 — Review and stabilization loop

Deliverables:

- Review queue driven by validation diagnostics, low-confidence candidates, unresolved references, unknown role warnings, and skeleton graph conflicts.
- Freeze / unfreeze policies aligned with Core status output.
- Regeneration metadata and replacement notes where useful.
- Diagnostic repair planning through configured LLM providers.

Exit criteria:

- POR can revise candidate structures without losing history and can export updated Core-compatible drafts.
- POR can explain why a candidate was frozen, reopened, merged, split, or rejected.

### Phase 5 — Provider and fixture hardening

Deliverables:

- Local/cloud/mock LLM provider adapters.
- Golden sample fixtures for source ingestion, skeleton graph formation, CLI validation, and repair loops.
- Provider privacy policy checks.
- Failure-mode tests for missing CLI, incompatible CLI, unavailable LLM endpoint, malformed LLM output, and interrupted sessions.

Exit criteria:

- The same fixture can run with a mock provider in CI and with configured local/cloud providers during development.
- POR can fail gracefully when external CLI or LLM dependencies are unavailable.

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

## Recommended next artifact

The next document should be `docs/dev/v0.2.0/por-engine-architecture-v0.2.md`.

It should turn this plan into a module-level architecture with:

- data model sketches;
- skeleton graph schema and graph query examples;
- command surface assumptions;
- `ideamark-cli` install / discovery / validation handoff flow;
- LLM provider registry and task routing model;
- Core v1.2.0 export examples;
- validation handoff flow;
- non-goals for v0.2.0.
