# POR v0.3.0 Design Hypothesis — Evidence Landscape

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/por-v0.3.0-reconstruction-front-end.md`
- `docs/dev/v0.3.0/por-v0.3.0-harmony-score-flow.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose

This document introduces **Evidence Landscape** as a working concept for IdeaMark
POR, Retrieval, Harmony, and Reconstruction.

The central hypothesis is:

> Intellectual Activity should not be reconstructed from only the highest-credit
> candidate model. It should be reconstructed from a landscape of supporting,
> competing, diverging, derivative, uncertain, and minority candidate models,
> each evaluated within an explicit finite candidate space and evidence context.

This idea generalizes the advice that a knowledge system should include not only
"correct" information but also counter-evidence and alternative materials.

## 2. Why a Correct-Only DB Is Fragile

A knowledge database that only contains correct-looking answers is fragile for
intellectual activity.

It may be useful for direct lookup, but it weakens the ability to:

- compare alternative explanations;
- notice edge cases;
- handle incomplete evidence;
- explain why a conclusion was selected;
- revise a conclusion when new evidence appears;
- generate balanced, contrastive, or exploratory reconstructions.

In this sense, counter-evidence is not merely an error or an obstacle. It is a
material condition for higher-quality reconstruction.

An LLM can generate more usefully when constrained by guardrails. Similarly,
IdeaMark Reconstruction can generate more usefully when it knows not only the
most supported candidate model, but also the surrounding alternatives and the
vectors by which they differ.

## 3. Harmony Credit Is Not Truth Probability

Harmony Credit does not mean:

```text
Candidate A is 91% true.
```

It means something closer to:

```text
Within this finite candidate space,
under this Projection,
using this Evidence Set,
and applying this Evaluation Policy,
Candidate A was selected with this degree of relative support.
```

Therefore, Harmony Credit should always be interpreted together with its context:

```yaml
harmony_context:
  projection_id: PROJ-001
  domain_distribution_id: DOMDIST-001
  evidence_set_id: EVSET-001
  candidate_space_id: CSPACE-001
  evaluation_policy_id: EPOL-001
```

Without this context, Harmony Credit is easily misread as an absolute truth
probability.

## 4. Evidence Landscape

An **Evidence Landscape** is the structured set of candidate models and their
relationships after retrieval and Harmony evaluation.

It contains:

- the selected high-credit model;
- near competitors;
- counter-models;
- derivative models;
- minority models;
- unresolved hypothesis models;
- unknown-dimension models;
- the evidence and counter-evidence attached to each candidate;
- the relationship vectors among candidates.

A simplified shape:

```text
Candidate A: high credit, selected
Candidate B: medium credit, similar but weaker
Candidate C: lower credit, contrasting vector
Candidate D: derived from B
Candidate E: minority hypothesis with unresolved unknowns
```

The key point is that Reconstruction should not only know which candidate won.
It should also know what kind of landscape it won against.

## 5. Candidate Relations

Candidate models in an Evidence Landscape may relate to each other in multiple
ways.

Suggested initial relation types:

```yaml
candidate_relation_types:
  - supports
  - contrasts
  - competes_with
  - derives_from
  - generalizes
  - specializes
  - refines
  - weakens
  - strengthens
  - fills_gap_for
  - introduces_unknown
  - shares_evidence_with
  - depends_on
  - excludes
```

These relations are not necessarily final IdeaMark Core relations. They may
initially remain POR session artifacts.

## 6. Vector Difference Matters More Than Rank Alone

A ranked candidate list is insufficient.

Example:

```yaml
candidate_ranking:
  - candidate: CM-A
    harmony_credit: 0.91
  - candidate: CM-B
    harmony_credit: 0.74
  - candidate: CM-C
    harmony_credit: 0.52
```

This ranking does not explain whether CM-B is a minor variation of CM-A or a
substantively different explanation. It also does not explain whether CM-C is
weak because it lacks evidence or because it is directly contradicted.

Evidence Landscape should preserve vector differences:

```yaml
candidate_vectors:
  CM-A:
    main_vector: selected_explanation
    evidence_coverage: high
    counter_evidence_collision: low
    unknown_dimensions: low
  CM-B:
    main_vector: alternative_scope
    evidence_coverage: medium
    counter_evidence_collision: low
    unknown_dimensions: medium
  CM-C:
    main_vector: contrasting_explanation
    evidence_coverage: medium
    counter_evidence_collision: high
    unknown_dimensions: low
```

The vector difference is what allows Reconstruction to decide whether to ignore,
fuse, contrast, or preserve a candidate.

## 7. Reconstruction Modes over Evidence Landscape

Different output needs require different uses of the landscape.

### 7.1 Winner-only Reconstruction

Use only the highest Harmony Credit candidate.

Useful for:

- concise answers;
- deterministic summaries;
- operational recommendations;
- source-bounded output.

```yaml
reconstruction_landscape_policy:
  mode: winner_only
  use_candidates: top_1
  include_counter_evidence: false
```

### 7.2 Guarded Winner Reconstruction

Use the highest-credit candidate but weaken or qualify the output based on
counter-evidence, uncertainty, or close competitors.

Useful for:

- factual reports;
- conservative analysis;
- expert-facing summaries.

```yaml
reconstruction_landscape_policy:
  mode: guarded_winner
  use_candidates: top_1
  inspect:
    - counter_models
    - close_competitors
    - unresolved_unknowns
  output_effect:
    - qualify_claims
    - add_limitations
```

### 7.3 Fusion Reconstruction

Fuse multiple candidates with different Harmony Credits into one composite
output.

Useful for:

- synthesis;
- training materials;
- strategy documents;
- interdisciplinary knowledge reuse.

```yaml
reconstruction_landscape_policy:
  mode: fusion
  include_candidates:
    credit_min: 0.45
    relation_types: [supports, fills_gap_for, refines]
  preserve_conflicts: true
```

### 7.4 Contrastive Reconstruction

Place candidates in explicit comparison.

Useful for:

- debate;
- policy review;
- risk analysis;
- research discussion;
- explanation of why a model was selected.

```yaml
reconstruction_landscape_policy:
  mode: contrastive
  compare:
    selected: CM-A
    against: [CM-B, CM-C]
  include_components:
    - evidence_coverage
    - counter_evidence_collision
    - unknown_dimensions
    - constraint_satisfaction
```

### 7.5 Exploratory Reconstruction

Keep lower-credit or unknown-dimension models as hypothesis material.

Useful for:

- hypothesis generation;
- research planning;
- future investigation;
- creative ideation under explicit labels.

```yaml
reconstruction_landscape_policy:
  mode: exploratory
  include_candidates:
    allow_low_credit: true
    require_label: hypothesis
  preserve_unknown_dimensions: true
```

## 8. Evidence Landscape Data Shape

Initial experimental data shape:

```yaml
evidence_landscape:
  landscape_id: ELAND-001
  harmony_context:
    projection_id: PROJ-001
    domain_distribution_id: DOMDIST-001
    evidence_set_id: EVSET-001
    candidate_space_id: CSPACE-001
    evaluation_policy_id: EPOL-001

  selected_candidate: CM-A

  candidates:
    - candidate_id: CM-A
      harmony_credit: 0.91
      rank: 1
      role_in_landscape: selected
      evidence_refs: [FRAG-001, FRAG-004, FRAG-007]
      counter_evidence_refs: [FRAG-011]
      unknown_dimensions: []
      credit_components:
        evidence_coverage: 0.88
        counter_evidence_handling: 0.76
        source_anchor_integrity: 0.95

    - candidate_id: CM-B
      harmony_credit: 0.74
      rank: 2
      role_in_landscape: close_competitor
      evidence_refs: [FRAG-001, FRAG-004]
      counter_evidence_refs: []
      unknown_dimensions: [time_window_to]

    - candidate_id: CM-C
      harmony_credit: 0.52
      rank: 3
      role_in_landscape: counter_model
      evidence_refs: [FRAG-011, FRAG-014]
      counter_evidence_refs: [FRAG-001, FRAG-004]
      unknown_dimensions: []

  candidate_relations:
    - type: competes_with
      from: CM-A
      to: CM-B
      basis: shared_evidence
    - type: contrasts
      from: CM-C
      to: CM-A
      basis: opposing_vector
    - type: fills_gap_for
      from: CM-B
      to: CM-A
      basis: unknown_dimension_completion
```

## 9. Relationship to Domain Distribution

Evidence Landscape is always produced within a Domain Distribution or a declared
Domain shortcut.

This matters because the same candidate model can have different roles in
different domains.

Example:

- In a private cooking researcher DB, a sports-bike catalog IdeaMark Document may
  be an outlier but still part of that person's knowledge distribution.
- In an automotive R&D DB, the same document may be central.

Therefore, the landscape should preserve the Domain Distribution context used to
produce the Candidate Space.

```yaml
domain_context:
  mode: explicit_domain | emergent_distribution | hybrid
  explicit_domain_label: automotive_parts_r_and_d
  distribution_source:
    database_id: DB-001
    document_population: ideamark_documents
  distribution_snapshot_id: DOMDIST-2026-07-10T090000
```

The population is IdeaMark Documents, not Original Sources. Original Sources are
inputs to POR; Domain Distribution is formed over structured IdeaMark Documents.

## 10. Relationship to Counter-Evidence

Counter-evidence should be generalized as **differently directed evidence**.

A fragment may be:

- direct counter-evidence;
- evidence for a competing model;
- evidence for a narrower scope;
- evidence for an exception;
- evidence for an unknown dimension;
- evidence that weakens the selected model without defeating it.

This is why Evidence Landscape is more general than a simple pair of
"supporting evidence" and "counter-evidence".

## 11. Relationship to Knowledge Reuse

IdeaMark aims to reuse intellectual activity, not only final knowledge.

Final knowledge reuse:

```text
Question -> Answer
```

Intellectual activity reuse:

```text
Evidence -> Candidate Models -> Landscape -> Selection / Fusion / Contrast -> Reconstruction
```

Evidence Landscape preserves the material needed to reuse the judgment process.

## 12. Experimental Session Artifacts

Suggested session artifacts:

```text
evidence_sets.jsonl
candidate_models.jsonl
candidate_vectors.jsonl
harmony_evaluations.jsonl
evidence_landscapes.jsonl
landscape_relations.jsonl
reconstruction_landscape_policy.json
```

These artifacts should initially remain experimental. Stable references or
summaries may later be promoted into IdeaMark Core or attached as Evidence
Blocks.

## 13. Open Design Questions

1. How many non-selected candidates should be kept in an Evidence Landscape?
2. Should low-credit minority models be kept by default or only under exploratory
   policies?
3. How should the system distinguish weak support from true contradiction?
4. Should Evidence Landscape be generated at Retrieval time, Harmony time, or
   Reconstruction time?
5. How should close competitors affect source-bounded Reconstruction?
6. How should landscape information be displayed to users without overwhelming
   them?
7. Should Evidence Landscape become part of IdeaMark Core, or remain a POR /
   Reconstruction session artifact?
8. How should different Evidence Landscapes from different Domain Distributions
   be compared or merged?

## 14. Working Position

For v0.3.0, the recommended working position is:

- POR collects anchored fragments and weak evidence-direction hints.
- Retrieval builds an Evidence Set under a Domain Distribution and Projection.
- Harmony evaluates candidate model vectors within a finite Candidate Space.
- Evidence Landscape preserves selected and non-selected candidates, their
  Harmony Credits, vector differences, and relations.
- Reconstruction uses a landscape policy to decide whether to output the winner,
  guard the winner, fuse candidates, contrast candidates, or preserve exploratory
  hypotheses.

This makes counter-evidence a first-class material for intellectual activity
without requiring the system to treat Harmony Credit as truth probability.
