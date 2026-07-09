# POR v0.3.0 Design Hypothesis — Domain Distribution

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/por-v0.3.0-reconstruction-front-end.md`
- `docs/dev/v0.3.0/por-v0.3.0-harmony-score-flow.md`
- `docs/dev/v0.3.0/por-v0.3.0-evidence-landscape.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose

This document records the working hypothesis that **Domain** in IdeaMark should
be treated not only as a fixed topical label, but also as a distributional
population boundary over IdeaMark Documents.

The central idea is:

> Domain is not primarily defined by what each document is about. Domain is
> defined by the population context in which a set of IdeaMark Documents is
> treated as a knowledge space.

This distinction is important for Retrieval, Projection, Harmony, Evidence
Landscape, and Reconstruction.

## 2. Domain Is a Population Boundary

In ordinary language, domain often means a named subject area:

- cooking;
- law;
- medicine;
- automotive parts;
- classical literature.

In IdeaMark, this is useful but incomplete.

A Domain can also be defined by the boundary of a knowledge population:

- all IdeaMark Documents in a private cooking researcher's database;
- all IdeaMark Documents in an automotive-parts R&D department database;
- all IdeaMark Documents in a classical literature scholar's private archive;
- all IdeaMark Documents selected for a specific project, partner, customer, or
  working group.

The important point is not only what the documents contain. The important point
is the context in which the population is declared or treated as a working
knowledge space.

## 3. Explicit Domain as Official Shortcut

When a Domain is named and the name is accepted by common sense or organizational
convention, humans and LLMs may use it as an official shortcut.

Example:

```yaml
domain:
  mode: explicit_domain
  label: automotive_parts_research_and_development
  declared_by: organization
```

This allows Projection authors to assume domain-specific expectations without
first computing a full distribution.

For example, in an automotive-parts R&D database, a Projection may reasonably
assume that terms, relations, and evidence patterns should be interpreted under
automotive engineering context.

This shortcut is useful and should be supported.

## 4. Emergent Domain as Distribution

When no reliable explicit Domain is available, or when the working knowledge
space is ambiguous, Domain can be approximated from the distribution of IdeaMark
Documents.

The population should be structured IdeaMark Documents, not Original Sources.

Original Sources are raw inputs. IdeaMark Documents are already decomposed into
entities, occurrences, sections, relations, perspectives, source anchors, and
projection traces. Therefore, they are the better population for estimating a
knowledge distribution.

Example distribution inputs:

```yaml
domain_distribution_inputs:
  population: ideamark_documents
  features:
    - entity_types
    - occurrence_roles
    - relation_types
    - section_patterns
    - projection_ids
    - skeleton_families
    - evidence_block_types
    - source_anchor_patterns
    - terminology_vectors
```

A label may later be attached for human convenience, but the label is not the
core definition.

## 5. Domain Distribution

A **Domain Distribution** is the statistical shape of a bounded population of
IdeaMark Documents.

Example:

```yaml
domain_distribution:
  domain_distribution_id: DOMDIST-001
  mode: emergent_distribution
  population:
    database_id: DB-001
    document_population: ideamark_documents
    document_count: 32000
    snapshot_time: 2026-07-10T09:00:00+09:00
  observed_features:
    entity_type_distribution: ref:entity_type_distribution.json
    relation_type_distribution: ref:relation_type_distribution.json
    section_pattern_distribution: ref:section_pattern_distribution.json
    projection_usage_distribution: ref:projection_usage_distribution.json
    skeleton_family_distribution: ref:skeleton_family_distribution.json
```

The exact statistical representation is implementation-dependent and may begin
as simple counts, frequencies, co-occurrence tables, or vector summaries.

## 6. Domain Is Dynamic

Domain Distribution is not static.

When a new IdeaMark Document enters a database, the distribution changes. In a
large database, a single outlier may not materially change the Domain
Distribution. In a small or specialized database, a single new document may
matter more.

Example:

- If a classical literature scholar's database contains one sports-bike catalog
  IdeaMark Document, the Domain may still be treated as the scholar's classical
  literature research domain.
- If the user explicitly labels some documents as sports-bike-related and manages
  multiple domains in the same database, the system should respect that label.

Therefore, Domain should support both declared boundaries and distributional
updates.

## 7. Explicit and Emergent Domains Should Coexist

The recommended design is not to choose one of the following exclusively:

```text
explicit domain only
emergent distribution only
```

Instead, IdeaMark should support a hybrid model:

```yaml
domain_context:
  mode: explicit_domain | emergent_distribution | hybrid
  explicit_domain:
    label: classical_literature_researcher_private_db
    declared_by: user
  distribution:
    population: ideamark_documents
    snapshot_id: DOMDIST-2026-07-10T090000
  conflict_policy:
    explicit_boundary_overrides_single_outliers: true
    document_labels_override_distribution_when_present: true
```

This lets human common sense and organizational convention work as an official
shortcut, while preserving the ability to build dynamic distributions for richer
Retrieval and Reconstruction.

## 8. Relationship to Prior

Domain is not exactly the prior itself.

Domain defines the population boundary from which operational priors can be
constructed.

A useful mental model:

```text
Domain Boundary
  -> Domain Distribution
  -> Projection
  -> Operational Prior
  -> Retrieval
  -> Harmony
  -> Reconstruction
```

The prior used for a specific operation may vary depending on Projection.

For example, the same cooking researcher's Domain Distribution may produce
different operational priors for:

- recipe retrieval;
- nutrition analysis;
- ingredient substitution;
- restaurant business analysis;
- culinary history;
- training material generation.

The Domain Distribution is shared, but each Projection selects and weights
features differently.

## 9. Relationship to Projection

Projection controls how a Domain Distribution is operationalized.

A Projection may specify:

```yaml
projection_controls:
  domain_policy:
    required: true
    accepted_modes:
      - explicit_domain
      - emergent_distribution
      - hybrid
    population_scope:
      source: database
      unit: ideamark_document
    prior_policy:
      derive_from_domain_distribution: true
      feature_weights:
        entity_type_distribution: 0.20
        relation_type_distribution: 0.20
        section_pattern_distribution: 0.15
        projection_usage_distribution: 0.15
        skeleton_family_distribution: 0.15
        terminology_vectors: 0.15
```

This means Projection is not created in a vacuum. It is created against a Domain
context, whether explicit or distributional.

## 10. Relationship to Retrieval

Retrieval should be understood as an operation over a Domain Distribution.

A Retrieve operation should preserve:

- which Domain boundary was used;
- which distribution snapshot was used;
- whether explicit labels or emergent distribution were used;
- which operational prior was derived;
- which population was searched;
- which parts of the population were excluded.

Example:

```yaml
retrieval_context:
  domain_context_id: DCTX-001
  domain_distribution_id: DOMDIST-001
  operational_prior_id: PRIOR-001
  population_unit: ideamark_document
  retrieval_scope:
    database_id: DB-001
    include_labels: [automotive_parts_r_and_d]
    exclude_labels: []
```

This is especially important when comparing outputs from different databases or
Domain contexts.

## 11. Relationship to Harmony Credit

Harmony Credit is always local to a finite Candidate Space and Evidence Set.

Domain Distribution helps define the population from which that Candidate Space
and Evidence Set were formed.

Therefore, Harmony Credit should preserve Domain context:

```yaml
harmony_context:
  domain_context_id: DCTX-001
  domain_distribution_id: DOMDIST-001
  distribution_snapshot_id: DOMDIST-2026-07-10T090000
  projection_id: PROJ-001
  evidence_set_id: EVSET-001
  candidate_space_id: CSPACE-001
  evaluation_policy_id: EPOL-001
```

This avoids treating Harmony Credit as an absolute truth score.

A model may be high-credit within one Domain Distribution and low-credit within
another. The difference is not a contradiction; it is a contextual result.

## 12. Relationship to Evidence Landscape

Evidence Landscape should include Domain context because selected and non-selected
candidates only make sense within the population used to retrieve and evaluate
them.

Example:

```yaml
evidence_landscape:
  landscape_id: ELAND-001
  domain_context:
    mode: hybrid
    explicit_domain_label: automotive_parts_r_and_d
    domain_distribution_id: DOMDIST-001
    distribution_snapshot_id: DOMDIST-2026-07-10T090000
  selected_candidate: CM-A
  non_selected_candidates:
    - CM-B
    - CM-C
```

If two Evidence Landscapes are produced from different Domain Distributions,
their Harmony Credits should not be compared without also comparing their Domain
contexts.

## 13. Relationship to Generate, Retrieve, and Reconstruct

The Domain Distribution hypothesis affects the whole IdeaMark lifecycle.

### 13.1 Generate

When generating a new IdeaMark Document, the system may use Domain context to
choose:

- likely entity types;
- useful occurrence roles;
- likely section patterns;
- suitable Skeleton Families;
- expected source-anchor patterns.

After generation, the new IdeaMark Document may update the Domain Distribution.

### 13.2 Retrieve

Retrieval uses Domain Distribution to construct an operational prior and to select
a finite Evidence Set.

### 13.3 Reconstruct

Reconstruction uses the Evidence Set, Candidate Space, Harmony Credit, Evidence
Landscape, and Domain context to decide how to produce an output.

A reconstruction may be:

- domain-conventional;
- domain-challenging;
- cross-domain;
- outlier-aware;
- explicitly exploratory.

## 14. Outliers and Mixed Domains

A single outlier document does not necessarily redefine a Domain.

However, mixed domains must be supported when users intentionally manage multiple
knowledge populations in the same database.

Recommended policy:

```yaml
mixed_domain_policy:
  if_document_labels_exist: respect_labels
  if_user_declares_multiple_domains: partition_by_declared_domain
  if_no_labels_exist: estimate_distributional_clusters
  if_outlier_detected: preserve_as_outlier_not_domain_shift
```

The system should not automatically infer that a database has changed Domain just
because an unusual IdeaMark Document appears.

## 15. Experimental Session Artifacts

Suggested artifacts:

```text
domain_contexts.jsonl
domain_distribution_snapshots.jsonl
domain_feature_counts.jsonl
domain_cooccurrence_tables.jsonl
operational_priors.jsonl
retrieval_contexts.jsonl
```

These should initially remain experimental. Stable summaries may later be
attached to IdeaMark Core documents or database metadata.

## 16. Open Design Questions

1. What is the minimum feature set needed for an initial Domain Distribution?
2. Should Domain Distribution be computed globally per database, per collection,
   per user, per project, or per explicit label?
3. How often should distribution snapshots be updated?
4. How should outliers be detected without incorrectly excluding valuable
   cross-domain material?
5. How should explicit Domain labels and emergent distribution disagree?
6. How should cross-domain Retrieval combine or compare multiple Domain
   Distributions?
7. Which Domain metadata belongs in IdeaMark Core, and which should remain
   database/session metadata?
8. How should humans inspect or edit Domain Distribution assumptions?

## 17. Working Position

For v0.3.0, the recommended working position is:

- Domain can be explicit, emergent, or hybrid.
- Explicit Domain is an official shortcut when accepted by common sense,
  organization, user declaration, or document labeling.
- Emergent Domain is represented as a distribution over IdeaMark Documents.
- The population is IdeaMark Documents, not Original Sources.
- Domain defines a population boundary from which Projection-specific operational
  priors can be derived.
- Generate, Retrieve, Harmony, Evidence Landscape, and Reconstruction should
  preserve Domain context when it affects interpretation.
- Harmony Credit should never be separated from the Domain Distribution and
  Candidate Space in which it was produced.

This lets IdeaMark support practical named domains while still treating rich and
dynamic knowledge databases as distributional populations for intellectual
activity reuse.
