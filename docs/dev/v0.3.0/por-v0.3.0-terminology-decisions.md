# POR v0.3.0 Terminology Decisions

Status: resolved terminology notes for v0.3.0 theory discussion
Target Core spec: `ideamark-core-v1.2.0`

This document records terminology decisions that should be applied across the
v0.3.0 theory notes as the docs are cleaned up.

## 1. Harmony Credit

Decision:

- Use **Harmony Credit** as the formal term.
- Treat **Harmony Score** as legacy wording unless it specifically refers to a
  numeric sub-score, intermediate calculation, or implementation-level component.
- Do not use Harmony Credit as a synonym for truth probability.

Rationale:

Harmony is evaluated inside a finite context:

```yaml
harmony_context:
  projection_id: PROJ-001
  domain_context_id: DCTX-001
  evidence_set_id: EVSET-001
  candidate_space_id: CSPACE-001
  evaluation_policy_id: EPOL-001
```

Therefore, the output is contextual credit for a candidate model, not an absolute
probability of correctness.

Recommended field naming:

```yaml
harmony_evaluation:
  candidate_model_id: CM-001
  harmony_credit:
    method: weighted_observable_components
    value: 0.68
    components:
      key_match_ratio: 0.75
      range_match_ratio: 0.67
      sampling_support_ratio: 0.40
      cooccurrence_support: 0.82
      nearest_model_similarity: 0.82
      counter_evidence_penalty: 0.15
      unknown_dimension_penalty: 0.10
```

Open follow-up:

- Decide whether decimal `value` should be displayed to users, or whether counts,
  ranks, and qualitative labels should be preferred in most interfaces.

## 2. fragment_quality

Decision:

- Replace probability-like **Local Confidence** with observable
  **fragment_quality**.
- `fragment_quality` should be derived from inspectable components.
- Avoid treating detector-specific numbers as directly comparable probabilities.

Rationale:

Different detection sources have different semantics:

- a regex match is not a probability;
- an LLM logprob is model-specific;
- a TinyBERT softmax is detector-specific;
- a human label may be high authority but still context-dependent;
- a source anchor can be exact without proving the label is correct.

Therefore, fragment quality should preserve observable evidence before any scalar
rollup is produced.

Recommended field naming:

```yaml
fragment:
  fragment_id: FRAG-001
  source_id: SRC-001
  anchor:
    line_from: 120
    line_to: 124
  fragment_quality:
    anchor:
      exact_line_range: true
      source_unit_match: paragraph
    boundary:
      boundary_source: source_structure
      alternative_boundary_count: 1
    detector_agreement:
      matched_detectors: 2
      total_detectors: 3
    label_ambiguity:
      candidate_label_count: 2
      selected_label: conditional_claim
    provenance:
      detector: rule
      version: 0.3.0-draft
```

Optional derived rollup:

```yaml
fragment_quality_rollup:
  method: observable_component_rollup_v0
  value: 0.72
```

The rollup is optional and should not replace the observable components.

## 3. v0.3.0 Theory vs Implementation Scope

Decision:

- Continue discussing the v0.3.0 theory until the main conceptual issues are
  mostly exhausted.
- After theory discussion stabilizes, create an implementation-scope plan.
- Do not prematurely force every theory component into immediate v0.3.0
  implementation.

Rationale:

The v0.3.0 theory notes now cover a broad architecture:

- Knowledge Reconstruction Front-end;
- Harmony Credit;
- Statistical Model-Vector Harmonization;
- Evidence Landscape;
- Domain Distribution;
- Creation / Retrieve / Reconstruction;
- Role Emergence Principle.

Only a subset should become immediate implementation work. The implementation
scope should be derived after unresolved conceptual boundaries are clarified.

## 4. Documentation Cleanup Guidance

When updating existing theory notes:

- Replace general `Harmony Score` wording with `Harmony Credit`.
- Keep file paths unchanged unless a later rename is explicitly desired.
- Replace `Local Confidence` with `fragment_quality`.
- Replace probability-like confidence examples with observable component examples.
- Preserve historical context only when useful for explaining why the term changed.
- Keep unresolved conceptual questions in `README.md` until they are explicitly
  decided.
