# POR v0.3.0 Design Hypothesis — Creation / Retrieve / Reconstruction Process Model

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/por-v0.3.0-reconstruction-front-end.md`
- `docs/dev/v0.3.0/por-v0.3.0-harmony-score-flow.md`
- `docs/dev/v0.3.0/por-v0.3.0-evidence-landscape.md`
- `docs/dev/v0.3.0/por-v0.3.0-domain-distribution.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose

This document separates three processes that are easily confused in IdeaMark POR
and downstream processing:

1. **Creation**
2. **Retrieve**
3. **Reconstruction**

Projection and IdeaMark may share similar structural concepts, but they play
different roles depending on which process is being executed.

The central hypothesis is:

> IdeaMark does not create one universal index from an Original Source. It creates
> projection-dependent indexes. Those indexes later serve different functions in
> Retrieve and Reconstruction.

## 2. Why This Separation Matters

In conventional knowledge databases, the system often assumes a generalized or
universal schema.

```text
Original Source
  -> generalized schema
  -> knowledge database
```

IdeaMark is different.

```text
Original Source
  -> Projection
  -> IdeaMark Document
```

The Projection determines how the source should be indexed for future knowledge
reuse. Therefore, the same Original Source may legitimately produce different
IdeaMark Documents under different Projections.

This makes Projection both:

- a knowledge reuse strategy; and
- an index construction policy.

## 3. Overview

```text
Creation
  Input:  Projection + Original Source + Domain Context
  Output: IdeaMark Document stored in DB

Retrieve
  Input:  Projection + Domain Context + IdeaMark DB
  Output: retrieved IdeaMark Documents / Elements / Evidence Sets

Reconstruction
  Input:  Projection + retrieved IdeaMark Documents + Original Source fragments + Elements
  Output: expression that activates or supports Intellectual Activity
```

These processes are connected, but they should not be treated as one execution
step.

## 4. Creation

### 4.1 Definition

Creation is the process that creates an IdeaMark Document for storage in a DB.

Input:

```text
Projection
Original Source
Domain Context
```

Output:

```text
IdeaMark Document
```

### 4.2 Projection Role in Creation

In Creation, Projection functions as **Index Construction Policy**.

It determines:

- what should be treated as an Entity;
- what should be treated as an Occurrence;
- what should be treated as a Relation;
- what sections should be constructed;
- what source anchors should be preserved;
- what evidence-like fragments should be retained;
- what can be ignored for this knowledge reuse purpose;
- what future retrieval or reconstruction tasks should be supported.

Example:

```yaml
creation_projection_role:
  role: index_construction_policy
  controls:
    entity_boundary_policy: projection_defined
    occurrence_role_policy: projection_defined
    relation_policy: projection_defined
    source_anchor_policy: preserve_reconstructable_spans
    future_reuse_target: training_material_generation
```

### 4.3 Domain Role in Creation

Domain may be explicit, emergent, or hybrid.

The Domain Context may be used by any layer as needed, but it should not force all
layers to become domain-dependent.

Example:

```yaml
creation_context:
  domain_context:
    mode: hybrid
    explicit_domain_label: automotive_parts_r_and_d
    domain_distribution_id: DOMDIST-001
  projection_id: PROJ-CREATE-001
  source_id: SRC-001
```

Domain may influence:

- expected terminology;
- likely entity categories;
- slot expectations;
- fragment prioritization;
- source-structure interpretation;
- operational priors.

However, domain dependence should be introduced deliberately and recorded.

### 4.4 IdeaMark Role after Creation

The created IdeaMark Document has at least two later roles:

1. In Retrieve, it functions as an index.
2. In Reconstruction, it functions as an annotation for reading Original Source
   fragments.

```text
Creation Output: IdeaMark Document
  -> Retrieve role: precomputed index
  -> Reconstruction role: source interpretation annotation
```

## 5. Retrieve

### 5.1 Definition

Retrieve is the process that uses a Projection to find necessary IdeaMark
Documents, Elements, or Evidence Sets from a DB.

Input:

```text
Projection
Domain Context
IdeaMark DB
```

Output:

```text
Retrieved IdeaMark Documents
Retrieved Elements
Evidence Set
Candidate Space
Optional Evidence Landscape
```

### 5.2 Projection Role in Retrieve

In Retrieve, Projection functions as **Query / Retrieval Policy**.

It determines:

- what kind of IdeaMark Documents should be searched;
- which structures or parameters should match;
- which Elements are needed;
- what Harmony Credit policy should be used;
- whether to retrieve only high-credit candidates or also alternatives;
- whether counter-evidence or differently directed evidence is required.

Example:

```yaml
retrieve_projection_role:
  role: query_and_retrieval_policy
  required_structures:
    - evidence_item
    - counter_evidence_candidate
    - recommendation_candidate
  harmony_credit_policy:
    mode: guarded_winner
    include_close_competitors: true
    include_counter_models: true
```

### 5.3 IdeaMark Role in Retrieve

In Retrieve, IdeaMark Documents act as precomputed indexes.

They provide low-cost signals for search and extraction:

- entity types;
- occurrence roles;
- relation types;
- section structure;
- source anchors;
- projection traces;
- model vector parameters;
- Harmony-related metadata;
- domain context references.

The Original Source does not need to be fully read during early retrieval. The
IdeaMark Document is used to decide which source fragments or documents are
worth inspecting.

### 5.4 Harmony Credit in Retrieve

Harmony Credit helps arrange retrieved materials, but it is not truth
probability.

It helps answer questions such as:

- which candidate is most supported in this Candidate Space?
- which competing candidates should be kept?
- which lower-credit candidates are useful as counter-material?
- which candidates should be fused, contrasted, or ignored?

Retrieve may output an Evidence Landscape when the process must preserve selected
and non-selected candidates for later Reconstruction.

## 6. Reconstruction

### 6.1 Definition

Reconstruction is the process that forms an expression from retrieved materials.

Input:

```text
Projection
Retrieved IdeaMark Documents
Original Source fragments
Elements
Evidence Landscape
Domain Context
```

Output:

```text
Expression for Intellectual Activity
```

The output may be a report, explanation, recommendation, slide outline, training
unit, TPCG model, OKF document, video script, or another representation.

### 6.2 Projection Role in Reconstruction

In Reconstruction, Projection functions as **Material Processing Direction**.

It determines:

- what expression should be produced;
- how retrieved Elements should be transformed;
- whether the output should be source-bounded or hypothesis-generating;
- whether to use winner-only, guarded, fusion, contrastive, or exploratory mode;
- how to handle counter-evidence;
- how strongly to preserve original wording;
- how to introduce, guide, or activate user Intellectual Activity.

Example:

```yaml
reconstruction_projection_role:
  role: material_processing_direction
  output_target: expert_facing_explanation
  epistemic_mode: conservative_inference
  landscape_policy:
    mode: guarded_winner
    inspect:
      - close_competitors
      - counter_models
      - unresolved_unknowns
  expression_policy:
    preserve_source_anchors: true
    label_hypotheses: true
    include_limitations: true
```

### 6.3 IdeaMark Role in Reconstruction

In Reconstruction, IdeaMark is not merely a search index.

It is an annotation layer that tells the system how to read and use Original
Source fragments.

IdeaMark may indicate:

- which fragment supports which Entity or Occurrence;
- which role a source span played under the Creation Projection;
- which source spans are relevant to a slot;
- which fragments are evidence, counter-evidence, or differently directed
  evidence;
- how source fragments can become Elements for output generation.

### 6.4 Element Role in Reconstruction

An Element is a reconstruction-time material prepared from IdeaMark annotations
and Original Source fragments.

```text
IdeaMark annotation
  + Original Source fragment
  -> Element
```

Elements are not necessarily final claims. They are processable materials for
expression generation.

Example:

```yaml
element:
  element_id: ELEM-001
  source_fragment_ref: SRC-001#L120-L124
  ideamark_annotation_ref: OCC-001
  role: supporting_evidence
  text: "...source span..."
  reconstruction_use:
    suitable_for:
      - source_bounded_summary
      - guarded_explanation
```

## 7. Same Structures, Different Roles

Projection and IdeaMark may use similar structural vocabularies, but their roles
change by process.

| Process | Projection role | IdeaMark role | Original Source role |
| --- | --- | --- | --- |
| Creation | Index Construction Policy | Output index / annotated reading | Raw input |
| Retrieve | Query / Retrieval Policy | Precomputed searchable index | Usually deferred until needed |
| Reconstruction | Material Processing Direction | Annotation for source fragments | Ground material for expression |

This prevents one concept from being overloaded as a universal object.

## 8. Relationship to Domain Distribution

Domain Context can be used in all three processes, but its role differs.

### 8.1 Creation

Domain may influence how the Projection constructs the IdeaMark index.

### 8.2 Retrieve

Domain defines or helps define the population from which candidates and Evidence
Sets are retrieved.

### 8.3 Reconstruction

Domain may influence expression style, assumptions, terminology, operational
priors, and how outliers or cross-domain materials are introduced.

However, not every layer should automatically become domain-dependent. Domain
usage should be explicit or traceable.

## 9. Relationship to Skeleton Precursor, Micro Skeleton, and Skeleton Family

The degree of domain dependence should be treated as a design question.

Recommended starting position:

```text
Skeleton Precursor
  -> primarily domain-neutral language / structure signal

Micro Skeleton
  -> domain-neutral type with projection/domain-sensitive weighting or growth policy

Skeleton Family
  -> primarily domain-neutral intellectual-activity structure

Projection
  -> selects Skeleton Family and applies Domain-informed slot expectations

Domain Distribution
  -> supplies operational priors for slot values, terminology, and candidate materials
```

This preserves cross-domain reuse while allowing practical domain-aware behavior.

### 9.1 Skeleton Precursor

Skeleton Precursors should remain as domain-neutral as possible.

They detect signals such as:

- time;
- quantity;
- comparison;
- condition;
- uncertainty;
- action;
- reference;
- evidence markers;
- limitation markers.

These signals can activate Intellectual Activity across domains.

### 9.2 Micro Skeleton

Micro Skeletons may remain domain-neutral in type, but their application can be
weighted by Projection or Domain.

For example, `measurement_statement` may be useful in many domains, but the
expected units and boundaries differ between cooking, medicine, finance, and
engineering.

### 9.3 Skeleton Family

Skeleton Family should remain as domain-neutral as practical.

It represents reusable intellectual-activity structures, such as:

- Observation -> Evidence -> Assessment -> Recommendation;
- Claim -> Support -> Counterpoint -> Revision;
- Problem -> Constraint -> Option -> Decision;
- Cause -> Effect -> Condition -> Intervention.

Domain should primarily affect slot expectations and operational priors, not the
existence of the intellectual-activity pattern itself.

## 10. Projection as Multi-Role Object

Projection is not one runtime object with one role.

It is a structural object that can be used differently by process.

```yaml
projection_roles:
  creation:
    role: index_construction_policy
  retrieve:
    role: query_and_retrieval_policy
  reconstruction:
    role: material_processing_direction
```

This makes it possible for one Projection definition to participate in multiple
processes, while still allowing each process to execute separately.

## 11. IdeaMark as Multi-Role Object

IdeaMark is also multi-role.

```yaml
ideamark_roles:
  retrieve:
    role: precomputed_index
  reconstruction:
    role: source_fragment_annotation
  domain_distribution:
    role: structured_population_sample
```

This is one of the major differences between an IdeaMark DB and a conventional
knowledge DB.

## 12. Process Traceability

Because the same structures appear in different roles, process traces should be
preserved.

Example:

```yaml
process_trace:
  creation:
    projection_id: PROJ-CREATE-001
    domain_context_id: DCTX-001
    source_id: SRC-001
    created_ideamark_document_id: IMDOC-001
  retrieve:
    projection_id: PROJ-RETRIEVE-001
    domain_distribution_id: DOMDIST-001
    retrieved_documents: [IMDOC-001, IMDOC-007]
    evidence_set_id: EVSET-001
  reconstruction:
    projection_id: PROJ-RECON-001
    evidence_landscape_id: ELAND-001
    output_id: OUT-001
```

This allows later systems or humans to inspect why a result was produced and
which role each object played.

## 13. Open Design Questions

1. Can one Projection safely serve all three roles, or should separate Projection
   profiles be declared for Creation, Retrieve, and Reconstruction?
2. How much of Domain Context should be visible to Skeleton Precursor detection?
3. Should Micro Skeleton weighting be purely Projection-driven, or may it use
   Domain Distribution directly?
4. Should Skeleton Family remain fully domain-neutral, or should domain-specific
   Skeleton Family extensions be allowed?
5. How should IdeaMark Documents record the Creation Projection so future
   Retrieve and Reconstruction processes can interpret them correctly?
6. What is the minimal Element shape needed for Reconstruction?
7. How should retrieved IdeaMark Documents be connected back to Original Source
   fragments at scale?
8. Should Evidence Landscape be produced during Retrieve or deferred until
   Reconstruction?

## 14. Working Position

For v0.3.0, the recommended working position is:

- Creation, Retrieve, and Reconstruction are separate processes.
- Projection and IdeaMark may share structural definitions, but their runtime
  roles differ by process.
- In Creation, Projection is Index Construction Policy.
- In Retrieve, Projection is Query / Retrieval Policy.
- In Reconstruction, Projection is Material Processing Direction.
- In Retrieve, IdeaMark is a precomputed index.
- In Reconstruction, IdeaMark is an annotation layer for Original Source
  fragments.
- Element is a reconstruction-time material created from IdeaMark annotations and
  Original Source fragments.
- Domain Context can influence all three processes, but domain usage should be
  explicit or traceable.
- Skeleton Precursor and Skeleton Family should remain as domain-neutral as
  practical to preserve cross-domain intellectual-activity reuse.

This process model clarifies how IdeaMark can support projection-dependent index
creation, efficient retrieval, and reconstruction of expressions that activate
user Intellectual Activity.
