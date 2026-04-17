# POR Engine Internal Modules

## Development Specification v0.2

This document defines the internal module structure of the **POR (Progressive Occurrence Resolution) engine**
used in the IdeaMark processing pipeline.

POR transforms logical segments into **portable interpretive candidates**
that can later be synthesized into IdeaMark documents.

The engine prioritizes:

- high recall extraction
- preservation of unresolved signals
- avoidance of premature merging
- deferred final selection until synthesis stage
- context_force-first interpretation
- retroactive reinterpretation support

------------------------------------------------------------------------

# Module Overview

| Module | Responsibility | Main Input | Main Output | Execution Style | Controlled By |
|---|---|---|---|---|---|
| `segment_interpreter` | Interpret logical segment and prepare extraction cues | logical segment | interpreted segment | model-assisted | por-policy, por-config |
| `context_force_extractor` | Extract local `context_force` hypotheses from fragments within a window | interpreted segment, local context | raw context_force hypotheses | model-assisted | por-policy |
| `explicit_entity_cue_extractor` | Extract strong explicit entity cues as a secondary path | interpreted segment | explicit entity cues | model-assisted / deterministic | por-policy |
| `force_normalizer` | Normalize force hypotheses, assign IDs, store spans, provenance, and modality | raw force hypotheses | normalized force candidates | deterministic | por-config |
| `force_registry` | Maintain global registry of force-bearing fragments and hypothesis history | normalized force candidates | force registry state | deterministic | core engine |
| `overlap_resolver` | Resolve ingest overlap and semantic overlap relationships | segments, overlap hints | overlap relations | deterministic | ingest-config, por-config |
| `window_builder` | Construct reconciliation windows across segments | segments, overlap relations | windows | deterministic | por-config |
| `forward_reconciler` | Compare how later fragments act on earlier context inside a window | windows, force registry | forward reconciliation state | hybrid | por-policy, por-config |
| `retro_reconciler` | Detect retroactive reinterpretation caused by later context | windows, force registry | retro-force signals | hybrid | por-policy, por-config |
| `force_trace_builder` | Bundle local force hypotheses into trace structures | forward/retro reconciliation state | force traces | deterministic | por-config |
| `force_cluster_builder` | Merge related traces across overlaps/windows without premature collapse | traces, overlap relations | force clusters | deterministic + model hints | por-policy |
| `support_aggregator` | Aggregate support signals such as heading, repetition, transition, silence, emphasis | registry, metadata, windows | support scores | deterministic | por-config |
| `transition_analyzer` | Detect bridge, shift, continuation, reveal, reversal transitions | ordered windows, traces | transition signals | hybrid | por-policy, por-config |
| `emergent_entity_builder` | Let entity candidates emerge from stabilized force clusters | force clusters, explicit entity cues | emergent entity hypotheses | hybrid | por-policy |
| `occurrence_projection_builder` | Project possible final IdeaMark occurrence roles from emergent entities | emergent entity hypotheses, force clusters | occurrence projections | hybrid | por-policy, por-config |
| `section_emergence_builder` | Build section anchorage hypotheses from force/occurrence structure | force clusters, occurrence projections, headings | section projections | hybrid | por-policy, por-config |
| `relation_hypothesis_builder` | Propose relations such as supports / enables / contrasts / reframes | force clusters, emergent entities, windows | relation hypotheses | hybrid | por-config |
| `confidence_evaluator` | Compute confidence axes for forces, traces, clusters, and emergent structures | scores, signals, projections | confidence values | deterministic | por-config |
| `state_updater` | Update accepted / provisional / discarded states | confidence axes, policy rules | candidate states | deterministic | por-config |
| `freeze_controller` | Decide which structures freeze and which remain plastic | candidate states, transition signals | freeze decisions | deterministic | por-config |
| `draft_state_emitter` | Emit POR draft state snapshot or delta | full POR state | POR draft output | deterministic | output contract |
| `synthesis_adapter` | Prepare POR output for IdeaMark synthesis stage | POR draft | synthesis-ready candidates | deterministic | ideamark-policy, template |

------------------------------------------------------------------------

# Architectural Layers

## 1. Interpretation Layer

Responsible for detecting local interpretive action from segments.

Modules:
- `segment_interpreter`
- `context_force_extractor`
- `explicit_entity_cue_extractor`

Goal:
- High recall extraction of local contextual action signals
- Preserve explicit entity cues without making them primary

------------------------------------------------------------------------

## 2. Force Management Layer

Responsible for preserving extracted force-bearing fragments and managing provenance.

Modules:
- `force_normalizer`
- `force_registry`

Goal:
- Maintain reusable interpretive candidates without premature collapse

------------------------------------------------------------------------

## 3. Context Reconstruction Layer

Responsible for reconstructing local context using overlaps and windows.

Modules:
- `overlap_resolver`
- `window_builder`

Goal:
- Recover continuity without reconstructing the full original document

------------------------------------------------------------------------

## 4. Reconciliation Layer

Responsible for forward and retroactive contextual evaluation.

Modules:
- `forward_reconciler`
- `retro_reconciler`
- `support_aggregator`
- `transition_analyzer`
- `confidence_evaluator`

Goal:
- Resolve competing interpretations across windows
- Track reinterpretation rather than overwrite history

------------------------------------------------------------------------

## 5. Emergence Layer

Responsible for allowing reusable structural candidates to emerge.

Modules:
- `force_trace_builder`
- `force_cluster_builder`
- `emergent_entity_builder`
- `occurrence_projection_builder`
- `section_emergence_builder`
- `relation_hypothesis_builder`

Goal:
- Let Entity / Occurrence / Section candidates emerge from reconciled force structures

------------------------------------------------------------------------

## 6. Stabilization and Output Layer

Responsible for finalizing the POR draft state.

Modules:
- `state_updater`
- `freeze_controller`
- `draft_state_emitter`
- `synthesis_adapter`

Goal:
- Produce a reusable intermediate representation for IdeaMark synthesis

------------------------------------------------------------------------

# Force-Bearing Fragment Structure (Recommended)

Each extracted fragment candidate should minimally contain:

| Field | Description |
|---|---|
| `fragment_id` | Unique identifier |
| `surface_form` | Original textual or event form |
| `source_segments` | Segments where the fragment appeared |
| `context_force_hypotheses` | Local forward action hypotheses |
| `retro_force_hypotheses` | Retroactive reinterpretation hypotheses |
| `support_signals` | Heading / figure / repetition / transition / silence / emphasis evidence |
| `confidence_axes` | Multi-axis confidence values |
| `selection_state` | accepted / provisional / discarded |
| `freeze_state` | plastic / frozen |

Optional later-stage fields:

| Field | Description |
|---|---|
| `emergent_entity_hypotheses` | Candidate reusable entities emerging from force structure |
| `occurrence_projections` | Candidate final occurrence roles |
| `section_projections` | Candidate section anchorage placements |

------------------------------------------------------------------------

# Design Principle

POR is not a system for reconstructing the original document perfectly.

Instead it aims to:

> Extract portable interpretive signals while preserving contextual traces
> so they can later stabilize into reusable IdeaMark structures.

A fragment is useful even when its final Entity boundary is unresolved.
