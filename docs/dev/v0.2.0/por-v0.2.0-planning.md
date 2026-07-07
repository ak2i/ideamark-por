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

## Planning goals

1. Define POR v0.2.0 as a companion progressive authoring engine for IdeaMark Core v1.2.0.
2. Preserve POR's stateful session model while preventing runtime state from leaking into required Core documents.
3. Produce Core-compatible draft exports with `meta`, `sources`, `sections`, `occurrences`, and `entities`.
4. Treat Projection input as guidance for decomposition, source-window formation, occurrence roles, entity boundaries, traceability, uncertainty, and review priorities.
5. Keep `ideamark-cli` authoritative for stateless document validation, formatting, describe output, and export verification.

## Core boundary principles

POR v0.2.0 MUST maintain a hard boundary between internal state and Core documents.

### POR-owned internal state

POR may store and update:

- source ingestion state;
- chunking and scheduling state;
- context-force hypotheses;
- retroactive reinterpretation history;
- force traces and force clusters;
- candidate scores;
- plastic / frozen state;
- review queues;
- LLM prompt plans and model outputs;
- diagnostics and retry metadata.

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
| Reconciliation | `force_trace`, `force_cluster`, `support_signal`, `transition_signal` | Entity boundary decisions, Occurrence role decisions, Section source-window decisions |
| Candidate construction | `reusable_material_candidate`, `placement_candidate`, `source_window_candidate` | `entities`, `occurrences`, `sections` |
| Stabilization | `selection_state`, `freeze_state`, review queues | Core status fields, generation metadata, optional companion diagnostics |
| Handoff | `draft_state`, `export_plan` | IdeaMark Core v1.2.0 document validated by `ideamark-cli` |

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

## Initial implementation phases

### Phase 0 — Spec alignment

Deliverables:

- Keep `docs/dev/v0.1.0` as historical reference.
- Add `docs/dev/v0.2.0` as the active planning line.
- Write the v0.2.0 architecture plan and Core boundary mapping.
- Identify required CLI contract assumptions for Core v1.2.0 validation.

Exit criteria:

- The team agrees that v0.2.0 is the active development baseline for Core v1.2.0.
- No v0.2.0 document claims POR owns Core document validity rules.

### Phase 1 — Session and source model

Deliverables:

- Session schema for sources, chunks, fragments, hypotheses, candidate states, diagnostics, and export plans.
- Source anchor representation compatible with Core v1.2.0 anchor expectations.
- Basic `por init`, `por status`, and source registration flow.

Exit criteria:

- POR can represent Original Sources and incremental ingestion state without producing Core objects prematurely.

### Phase 2 — Candidate pipeline

Deliverables:

- Context-force extraction and normalization interfaces.
- Force trace / cluster state model.
- Candidate builders for reusable material, role-bearing placements, and source-window Sections.

Exit criteria:

- POR can produce provisional candidate graphs from chunks while preserving uncertainty and reinterpretation history.

### Phase 3 — Core draft export

Deliverables:

- `core_boundary_mapper` that emits Core v1.2.0 draft structure.
- `ideamark_core_export_adapter` for file output.
- `cli_validation_handoff` for validation diagnostics.

Exit criteria:

- A POR session can emit a draft with required `meta`, `sources`, `sections`, `occurrences`, and `entities` namespaces.
- The draft can be passed to `ideamark-cli validate` in Core mode.

### Phase 4 — Review and stabilization loop

Deliverables:

- Review queue driven by validation diagnostics, low-confidence candidates, unresolved references, and unknown role warnings.
- Freeze / unfreeze policies aligned with Core status output.
- Regeneration metadata and replacement notes where useful.

Exit criteria:

- POR can revise candidate structures without losing history and can export updated Core-compatible drafts.

## Open questions

1. Should v0.2.0 store POR session state in SQLite from the first milestone, or begin with JSON session files for faster iteration?
2. Which subset of Core v1.2.0 anchor types should POR support first?
3. How should Projection/profile hints be represented locally before the official CLI fully supports v1.2.0 describe output?
4. Which POR metadata deserves declared extension output, and which must remain session-only?
5. Should role vocabulary be Projection-provided, document-local, or initially use the recommended Core v1.2.0 role vocabulary?

## Recommended next artifact

The next document should be `docs/dev/v0.2.0/por-engine-architecture-v0.2.md`.

It should turn this plan into a module-level architecture with:

- data model sketches;
- command surface assumptions;
- Core v1.2.0 export examples;
- validation handoff flow;
- non-goals for v0.2.0.
