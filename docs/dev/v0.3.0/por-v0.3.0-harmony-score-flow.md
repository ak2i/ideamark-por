# POR v0.3.0 Design Hypothesis — Harmony Score Integrated Reconstruction Flow

Status: hypothesis for design discussion
Baseline: `docs/dev/v0.3.0/por-v0.3.0-reconstruction-front-end.md`
Target Core spec: `ideamark-core-v1.2.0`
Previous draft: `docs/dev/v0.2.1/por-v0.2.1-harmony-score-flow.md` (promoted and removed)

## 1. Purpose

This document records a working hypothesis for integrating **Harmony Score** into
POR and the later IdeaMark processing flow.

The main idea is:

> POR should not finalize meaning. POR should collect anchored fragments and
> weak epistemic hints. Later Projection and Reconstruction stages should build
> candidate models and evaluate how well those models harmonize with the
> available evidence, counter-evidence, constraints, and uncertainty signals.

Harmony Score is not a replacement for confidence. It is a higher-level score
for evaluating the fit between a candidate reconstruction model and a set of
retrieved evidence fragments.

## 2. Background

POR v0.3.0 redefines POR as a Knowledge Reconstruction Front-end rather than a
completed text-to-IdeaMark generator. It should preserve reconstructable
annotation material and defer expensive reasoning to later Projection and
Reconstruction stages.

The current additional hypothesis is that later reconstruction will need at
least two distinct kinds of evaluation:

1. **Local confidence**
   - How reliable is a detector output, fragment boundary, source anchor, or
     local label?
2. **Model harmony**
   - How well does a candidate reconstruction explain, include, or withstand the
     retrieved evidence set?

These two should not be collapsed into a single `confidence` value.

## 3. Terminology

### 3.1 Evidence Fragment

An anchored fragment emitted by POR. It may include weak labels, source anchors,
SP/MS detections, and detector provenance.

### 3.2 Candidate Model

A structured interpretation generated during Projection / Reconstruction.
Examples:

- a factual answer model;
- a conservative hypothesis;
- a bold hypothesis;
- a TPCG model;
- an OKF document structure;
- a slide narrative;
- a training unit.

### 3.3 Harmony Score

A score that evaluates how well a Candidate Model matches the available evidence
fragments and reconstruction requirements.

Harmony Score is closer to:

- structural fit;
- evidence coverage;
- contradiction handling;
- constraint satisfaction;
- explanatory coherence;
- projection-specific adequacy.

It is not simply probability of truth.

### 3.4 Epistemic Mode

A reconstruction policy that specifies how far the system may go beyond source
text.

Suggested initial modes:

```yaml
epistemic_mode:
  enum:
    - source_bounded
    - conservative_inference
    - structured_hypothesis
    - bold_hypothesis
    - fictional
```

## 4. Processing Flow

```text
Original Source
  -> Source Adapter
  -> Source Structure
  -> Skeleton Precursors
  -> Micro Skeletons
  -> Idea Fragments
  -> Fragment Index / IdeaMark Annotation Index
  -> Projection Controls
  -> Retrieval Set
  -> Candidate Reconstruction Models
  -> Harmony Evaluation
  -> Selected / Parallel Reconstruction Outputs
```

The important change is that Harmony Evaluation happens after candidate models
exist. POR prepares the material for this evaluation but does not perform final
model judgment.

## 5. POR Responsibilities

POR should collect information that makes Harmony Score calculable later.

### 5.1 Source Adapter

The Source Adapter emits source units and structural hints:

- headings;
- paragraphs;
- sentence candidates;
- list items;
- table rows;
- line ranges;
- offsets;
- media time ranges in future adapters.

These are boundary hints, not truth claims.

### 5.2 Skeleton Precursor Detection

SP detection should include not only content triggers but also epistemic triggers.

Suggested SP categories:

```yaml
sp_types:
  content:
    - time_expression
    - quantity_expression
    - comparison_marker
    - condition_marker
    - action_marker
    - reference_marker
    - heading_marker
  epistemic:
    - evidence_marker
    - claim_marker
    - uncertainty_marker
    - contradiction_marker
    - exception_marker
    - limitation_marker
    - assumption_marker
    - counter_evidence_marker
```

### 5.3 Micro Skeleton Detection

Micro Skeletons identify local bootstrap patterns around SPs.

Harmony-related Micro Skeleton types may include:

```yaml
micro_types:
  - measurement_statement
  - observation_statement
  - evidence_statement
  - counter_evidence_statement
  - exception_clause
  - limitation_clause
  - conditional_claim
  - causal_claim
  - comparison_statement
  - recommendation_phrase
  - assumption_statement
```

### 5.4 Fragment Builder

Fragments should preserve enough local context to support later reconstruction.
They should not prematurely merge into a single entity or single cluster.

Recommended fragment-level additions:

```yaml
fragment:
  fragment_id: FRAG-001
  source_id: SRC-001
  source_unit_id: UNIT-012
  anchor:
    line_from: 120
    line_to: 124
    offset_from: 2048
    offset_to: 2310
  text_ref: source_span
  detected_sp:
    - type: uncertainty_marker
      text: "可能性"
  detected_ms:
    - micro_type: conditional_claim
      scope_rule: sentence
      confidence_hint: 0.64
  epistemic_hints:
    stance_candidate: qualifies
    basis_candidate: source_text
    target_hint: unknown
    direction_hint: weak_support
  detector_provenance:
    detector: rule
    version: 0.3.0-draft
  local_confidence:
    anchor_confidence: 0.95
    boundary_confidence: 0.72
    label_confidence: 0.58
```

## 6. Confidence vs Harmony Score

### 6.1 Confidence

Confidence should remain local and typed.

Examples:

```yaml
confidence:
  extraction_confidence: 0.91
  anchor_confidence: 0.98
  boundary_confidence: 0.76
  label_confidence: 0.63
  relation_hint_confidence: 0.52
```

A high local confidence only means the fragment or label is likely to have been
extracted correctly. It does not mean the final reconstruction is true.

### 6.2 Harmony Score

Harmony Score evaluates a candidate model against a set of fragments.

Example:

```yaml
harmony_evaluation:
  candidate_model_id: CM-001
  projection_id: PROJ-001
  evidence_set_id: EVSET-001
  score: 0.82
  components:
    key_match: 0.90
    range_match: 0.72
    sampling_support: 0.66
    counter_evidence_penalty: 0.18
    constraint_penalty: 0.05
    source_anchor_coverage: 0.88
    epistemic_mode_fit: 0.93
  notes:
    - "Model explains most key evidence but has weak sampling support."
```

## 7. Harmony Score Component Hypothesis

The initial Harmony Score may be a weighted composition of several component
scores.

```yaml
harmony_score_formula:
  score: weighted_sum_minus_penalties
  components:
    evidence_coverage:
      description: How much retrieved evidence is used by the model.
    key_element_match:
      description: Whether required key elements match the model.
    range_element_match:
      description: Whether model values fall inside acceptable ranges.
    sampling_element_support:
      description: Whether sampled or partial evidence supports the model.
    relation_coherence:
      description: Whether support/contrast/causal relations form a coherent structure.
    counter_evidence_handling:
      description: Whether contradictions and counter-evidence are addressed.
    constraint_satisfaction:
      description: Whether known constraints are respected.
    source_anchor_integrity:
      description: Whether claims remain traceable to source fragments.
    epistemic_mode_fit:
      description: Whether the output respects the requested epistemic mode.
  penalties:
    unsupported_claim_penalty: true
    ignored_counter_evidence_penalty: true
    excessive_inference_penalty: true
    source_boundary_violation_penalty: true
```

The formula should remain projection-specific. Different Projection types may
use different component weights.

## 8. Projection Controls

Projection should define both front-end extraction preferences and reconstruction
posture.

Example:

```yaml
projection_controls:
  decomposition_guidance:
    resolution: balanced
    recall_bias: high
    boundary_policy:
      prefer: [heading, paragraph, sentence]
      allow_cross_boundary: true
    fragment_policy:
      max_fragment_chars: 800
      prefer_source_structure: true
    detector_policy:
      mode: balanced
      sp_detector: rule
      ms_detector: ollama-small

  epistemic_policy:
    mode: structured_hypothesis
    allow_inference: true
    inference_strength: conservative
    separate_fact_and_hypothesis: true
    require_counter_evidence_check: true
    output_label_policy: per_claim_label

  harmony_policy:
    enabled: true
    compare_candidate_models: true
    minimum_score_for_selection: 0.70
    allow_parallel_outputs: true
    components:
      evidence_coverage: 0.20
      key_element_match: 0.20
      range_element_match: 0.10
      sampling_element_support: 0.10
      relation_coherence: 0.15
      counter_evidence_handling: 0.15
      source_anchor_integrity: 0.05
      epistemic_mode_fit: 0.05
```

## 9. Reconstruction Output Labels

Reconstruction outputs should carry labels that tell users what kind of output
they are reading.

Example:

```yaml
reconstruction_outputs:
  - output_id: OUT-FACT-001
    epistemic_mode: source_bounded
    harmony_score: 0.91
    claim_policy: source_text_only
    evidence_refs: [FRAG-001, FRAG-004]
    counter_evidence_refs: []

  - output_id: OUT-HYPO-001
    epistemic_mode: conservative_inference
    harmony_score: 0.78
    claim_policy: conservative_inference_allowed
    evidence_refs: [FRAG-001, FRAG-004, FRAG-007]
    counter_evidence_refs: [FRAG-009]
    risk_notes:
      - "Counter-evidence is addressed but not fully resolved."

  - output_id: OUT-BOLD-001
    epistemic_mode: bold_hypothesis
    harmony_score: 0.54
    claim_policy: analogy_and_weak_evidence_allowed
    evidence_refs: [FRAG-001, FRAG-007]
    speculative_jumps:
      - "Extends beyond direct source support."
```

## 10. Relationship to IdeaMark Core

There are two possible integration layers.

### 10.1 Session Artifact Layer

In v0.3.0, Harmony-related raw data may remain in POR session artifacts:

- `source_structure.jsonl`
- `sp.jsonl`
- `ms.jsonl`
- `fragments.jsonl`
- `candidate_models.jsonl`
- `harmony_evaluations.jsonl`

This avoids forcing all experimental fields into IdeaMark Core immediately.

### 10.2 IdeaMark Annotation Layer

Selected Harmony metadata may be attached to IdeaMark-compatible documents using
extension fields or evidence blocks.

Example:

```yaml
occurrences:
  OCC-001:
    entity: IE-001
    role: supports
    status:
      state: provisional
      confidence: 0.72
    epistemic:
      basis: extracted
      source_bound: true
      inference_level: none
    harmony_refs:
      - HEVAL-001
```

Longer evaluation data can be kept outside the core document and referenced by
URI or evidence block.

## 11. Initial Validation Plan

The Harmony-integrated model should be tested incrementally.

### Phase A: Fragment Preparation

Goal: confirm that POR emits enough anchored evidence for later scoring.

Checks:

- fragment anchors are stable;
- SP/MS outputs are parseable;
- epistemic cues are preserved;
- counter-evidence candidates are not discarded.

### Phase B: Candidate Model Comparison

Goal: compare multiple candidate reconstructions over the same fragment set.

Checks:

- source-bounded output uses only source-supported claims;
- conservative hypothesis is separated from facts;
- bold hypothesis is labeled as speculative;
- counter-evidence changes the Harmony Score.

### Phase C: Projection Sensitivity

Goal: verify that different projections produce meaningfully different fragment
rankings and candidate models.

Checks:

- same source, different projection controls;
- same fragments, different Harmony weights;
- parallel output labels are preserved.

### Phase D: Human Review

Goal: determine whether Harmony components help human reviewers understand why a
candidate reconstruction was selected or rejected.

Checks:

- reviewers can see which evidence was used;
- reviewers can see ignored or unresolved counter-evidence;
- reviewers can distinguish confidence from harmony;
- reviewers can adjust component weights or epistemic mode.

## 12. Open Design Questions

1. Should Harmony Score be calculated only during Reconstruction, or should POR
   provide preliminary fragment-level harmony hints?
2. What is the minimum component set for v0.3.0 experiments?
3. Should component weights be defined by Projection, Skeleton Family, or both?
4. How should counter-evidence be represented when the target claim is not yet
   known?
5. Should Harmony Score use a simple weighted sum first, or a log-score model
   inspired by evidence accumulation?
6. How should Harmony Score be displayed to users without implying objective
   truth probability?
7. Which fields belong in IdeaMark Core v1.2.0, and which should remain POR
   session artifacts until stabilized?

## 13. Working Position

For v0.3.0, the recommended working position is:

- POR emits fragments, SP/MS detections, source anchors, local confidence, and
  epistemic hints.
- Projection specifies epistemic policy and Harmony policy.
- Reconstruction creates candidate models.
- Harmony Evaluation scores candidate models against retrieved evidence sets.
- Outputs are labeled by epistemic mode and carry evidence/counter-evidence
  references.
- Harmony Score is treated as explanatory fit, not as truth probability.

This keeps POR fast and recall-oriented while preparing the downstream pipeline
for evidence-aware, counter-evidence-aware, and hypothesis-level-controlled
reconstruction.

## 14. Harmony Score as Statistical Model-Vector Harmonization

### 14.1 Motivation

Harmony Score should not require a fixed dictionary of named models.

A model can instead be treated as a statistical object produced from a
combination of parameters, observed elements, ranges, relations, frequencies, and
co-occurrence patterns.

In this interpretation:

```text
fixed model dictionary
  -> avoided when possible

statistical model vector
  -> derived from parameter combinations and evidence distributions
```

This is important because many useful reconstruction targets do not have a
stable human-readable category name in advance. They may still have a stable
statistical shape.

### 14.2 Model Vector

A **Model Vector** is a structured representation of a candidate model in a
parameter space selected by Projection or Skeleton Family.

Example dimensions:

```yaml
model_vector_dimensions:
  track_type: categorical
  time_window_from: temporal
  time_window_to: temporal
  time_window_distance: numeric_or_range
  place_from: spatial_or_symbolic
  place_to: spatial_or_symbolic
  relation_type: categorical
  facet_count: count
  evidence_count: count
  counter_evidence_count: count
  constraint_count: count
  cooccurrence_frequency: numeric
```

The concrete dimensions are not globally fixed. They are selected by the
Projection, Skeleton Family, or domain-specific adapter.

### 14.3 Evidence Vector

Evidence Fragments can be projected into the same parameter space as a Model
Vector.

```text
Evidence Fragment
  -> parameter extraction
  -> Evidence Vector
  -> comparison with Candidate Model Vector
```

An Evidence Vector may be incomplete. Missing dimensions do not automatically
invalidate it. Instead, missingness becomes part of the Harmony Evaluation.

Example:

```yaml
evidence_vector:
  fragment_id: FRAG-003
  dimensions:
    track_type: person_flow
    time_window_from: 3
    place_from: A
    place_to: E
    facet_count: 1
  missing_dimensions:
    - time_window_to
    - relation_type
```

### 14.4 Harmonize Operations

Statistical Model-Vector Harmonization supports at least three operations.

#### Completion Harmonize

Completion fills missing or ambiguous dimensions using nearby model vectors,
ranges, co-occurrence statistics, or constraints.

```text
partial evidence vector
  + neighboring model vectors
  -> completed candidate vector
```

This is useful when a fragment contains enough structure to suggest a model but
not enough information to fill every dimension.

#### Synthesis Harmonize

Synthesis combines multiple fragments or partial model vectors into a new
candidate model vector.

```text
fragment vector A
fragment vector B
fragment vector C
  -> synthesized candidate model vector
```

This allows Reconstruction to build a candidate model that does not appear as a
single explicit fragment in the source.

#### Hypothesis Harmonize

Hypothesis Harmonize keeps unknown or unobserved dimensions as explicit variables
rather than discarding the model.

```text
candidate model vector with unknown dimensions
  -> hypothesis model vector
  -> evaluated against available evidence and constraints
```

This makes it possible to handle detection models with unknown elements as
hypothesis models. Unknown dimensions become inspectable and testable, not hidden
free-form assumptions.

### 14.5 Harmony Score from Statistical Components

Harmony Score can be calculated from observable statistical components rather
than subjective scalar values.

Examples:

```yaml
statistical_harmony_components:
  key_element_match_count: 3
  key_element_required_count: 4
  range_element_match_count: 2
  range_element_required_count: 3
  sampling_support_count: 12
  sampling_candidate_count: 30
  cooccurrence_frequency: 48
  nearest_model_distance: 0.18
  counter_evidence_collision_count: 1
  unresolved_unknown_dimension_count: 2
```

This avoids relying on vague values such as "validity = 0.7" when the value range
cannot be defined cleanly.

A scoring layer may then normalize or combine these observable statistics:

```yaml
statistical_harmony_score:
  method: weighted_observable_components
  components:
    key_match_ratio: 0.75
    range_match_ratio: 0.67
    sampling_support_ratio: 0.40
    cooccurrence_support: 0.82
    nearest_model_similarity: 0.82
    counter_evidence_penalty: 0.15
    unknown_dimension_penalty: 0.10
  score: 0.68
```

The score remains an explanatory-fit score, not a truth probability.

### 14.6 Projection Role

Projection determines the parameter space.

It should be able to specify:

```yaml
projection_controls:
  model_vector_policy:
    enabled: true
    dimensions:
      - track_type
      - time_window_from
      - time_window_to
      - time_window_distance
      - place_from
      - place_to
      - relation_type
      - facet_count
    missing_dimension_policy: keep_as_unknown
    allow_completion: true
    allow_synthesis: true
    allow_hypothesis_vectors: true
```

This keeps the system from relying on one global model ontology. Different
Projections may define different parameter spaces for the same source.

### 14.7 Relationship to Skeleton Family

Skeleton Families should not be treated as exhaustive dictionaries of meaning.

They may instead define which parameter dimensions are useful for reconstructing
a particular intellectual activity.

Example:

```yaml
skeleton_family:
  id: causal_explanation_family
  accepts_model_vectors:
    required_dimensions:
      - relation_type
      - cause_candidate
      - effect_candidate
    optional_dimensions:
      - time_delay
      - confidence_hint
      - counter_evidence_count
      - constraint_count
  harmony_weights:
    relation_type_match: 0.25
    cause_effect_alignment: 0.30
    temporal_plausibility: 0.15
    counter_evidence_handling: 0.20
    source_anchor_integrity: 0.10
```

This preserves the role of Skeleton Family as a reconstruction aid while avoiding
a fixed dictionary of all possible models.

### 14.8 Session Artifacts

The following session artifacts may be useful for experiments:

```text
model_vectors.jsonl
fragment_vectors.jsonl
vector_matches.jsonl
harmonize_operations.jsonl
statistical_harmony_evaluations.jsonl
```

These should initially remain POR session artifacts. Only stable summaries or
references should be promoted into IdeaMark Core documents.

### 14.9 Working Hypothesis

The working hypothesis is:

- POR collects anchored Evidence Fragments and weak SP/MS hints.
- Projection defines the parameter space for model-vector comparison.
- Evidence Fragments are converted into Evidence Vectors.
- Reconstruction creates Candidate Model Vectors.
- Harmonize operations complete, synthesize, or preserve unknown dimensions.
- Harmony Score is computed from observable statistical components.
- Unknown elements remain explicit and testable rather than becoming hidden
  natural-language assumptions.

This makes Harmony Score useful not only for selecting among existing candidate
models, but also for constructing new hypothesis models from incomplete evidence.
