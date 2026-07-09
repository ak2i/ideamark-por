# POR v0.3.0 Glossary

Status: working glossary for v0.3.0 theory discussion
Target Core spec: `ideamark-core-v1.2.0`

This glossary records the current working vocabulary for the v0.3.0 theory notes.

Some terms are **standardized**. Others remain **provisional** because their
boundaries are still under discussion.

## 1. Status Labels

### Standardized

The term is accepted for the current v0.3.0 theory track. Existing documents
should move toward this wording during cleanup.

### Provisional

The term is useful for discussion, but its exact boundary may still change.

### Legacy

The term appears in older notes but should be avoided in new text unless it is
being discussed historically.

## 2. Standardized Terms

### Creation

Status: standardized

The process that creates an IdeaMark Document for storage in a DB.

Typical input:

```text
Projection + Original Source + Domain Context
```

Typical output:

```text
IdeaMark Document
```

In Creation, Projection functions as **Index Construction Policy**.

### Retrieve

Status: standardized

The process that uses a Projection and an IdeaMark DB to find necessary IdeaMark
Documents, Elements, Evidence Sets, or candidate materials.

In Retrieve, Projection functions as **Query / Retrieval Policy**.

Retrieve may preserve, mask, replace, or merge Domain Context depending on
process policy.

### Reconstruction

Status: standardized

The process that forms an expression from retrieved materials, IdeaMark
annotations, Original Source fragments, Elements, Evidence Landscapes, and a
Projection.

In Reconstruction, Projection functions as **Material Processing Direction**.

The output is an expression intended to activate or support user Intellectual
Activity.

### Role Emergence Principle

Status: standardized

The principle that structures remain process-neutral and their runtime roles are
assigned by the process in which they are used.

```text
Structure is process-neutral.
Role emerges from process.
```

Examples:

- Projection is not split into Creation Projection, Retrieve Projection, and
  Reconstruction Projection as separate structural types.
- Domain Context is not split into Creation Domain, Retrieve Domain, and
  Reconstruction Domain as separate structural types.
- IdeaMark Document is not split into separate structural types merely because it
  functions differently in Retrieve and Reconstruction.

### Projection

Status: standardized as process-neutral structure

A structural description of how knowledge should be viewed, selected,
decomposed, weighted, queried, or reconstructed.

Projection is process-neutral. Its role emerges from process:

| Process | Projection role |
| --- | --- |
| Creation | Index Construction Policy |
| Retrieve | Query / Retrieval Policy |
| Reconstruction | Material Processing Direction |
| Harmony | candidate evaluation / weighting policy |

### Domain Context

Status: standardized as process-neutral structure

A description of the population, convention, distribution, or knowledge-space
boundary being used.

Domain Context may be:

- explicit;
- emergent;
- hybrid.

Domain Context is process-neutral. Its role emerges from process.

A process may use Domain Context with policies such as:

```yaml
domain_usage_policy:
  mode: preserve | mask | replace | merge
```

### Domain Distribution

Status: standardized as concept, representation still provisional

The statistical shape of a bounded population of IdeaMark Documents.

The population is **IdeaMark Documents**, not Original Sources.

Domain Distribution can be used to derive Projection-specific Operational Priors.

### IdeaMark Document

Status: standardized as process-neutral structure

A structured document created from an Original Source under a Projection.

IdeaMark Document is process-neutral. Its role emerges from process:

| Process / Use | IdeaMark Document role |
| --- | --- |
| Retrieve | precomputed index |
| Reconstruction | annotation over Original Source fragments |
| Domain Distribution | structured population sample |
| Harmony / Evidence Landscape | source of candidate parameters and evidence references |

### Original Source

Status: standardized

The raw or source-level material from which an IdeaMark Document is created.

Examples:

- text document;
- PDF-extracted text;
- Markdown;
- HTML;
- transcript;
- table;
- future media source.

Original Source remains important in Reconstruction because IdeaMark annotations
can point back to source fragments.

### Harmony Credit

Status: standardized

A contextual, relative credit assigned to a Candidate Model or candidate output
inside a finite evaluation context.

Harmony Credit is evaluated with reference to:

- Projection;
- Domain Context / Domain Distribution;
- Evidence Set;
- Candidate Space;
- Evaluation Policy.

It is **not truth probability**.

Legacy term:

- Harmony Score.

Use `Harmony Score` only when referring to older text or to an implementation
sub-score / numeric component.

### fragment_quality

Status: standardized

Observable quality signals for a fragment, source anchor, boundary, detector
output, or local label.

`fragment_quality` replaces probability-like `Local Confidence`.

It should be derived from observable components, such as:

- anchor exactness;
- boundary stability;
- detector agreement;
- source-structure alignment;
- label ambiguity;
- duplicate or near-duplicate support;
- provenance quality.

Legacy term:

- Local Confidence.

### Evidence Landscape

Status: standardized as concept, representation still provisional

A structured landscape of selected and non-selected candidate models, their
Harmony Credits, vector differences, evidence, counter-evidence, and relations.

Evidence Landscape exists to preserve intellectual-activity material beyond the
highest-credit candidate.

It supports reconstruction modes such as:

- winner-only;
- guarded-winner;
- fusion;
- contrastive;
- exploratory.

### Element

Status: provisional but active

A reconstruction-time material prepared from IdeaMark annotations and Original
Source fragments.

Working shape:

```text
IdeaMark annotation + Original Source fragment -> Element
```

Elements are processable materials for expression generation. They are not
necessarily final claims.

## 3. Provisional Terms

### Idea Fragment

Status: provisional

A front-end fragment produced by POR before later evidence/model/vector processing.

Likely role:

```text
Source Structure + SP/MS detections + source anchor -> Idea Fragment
```

Open question:

- How exactly does Idea Fragment differ from Evidence Fragment and Element?

### Evidence Fragment

Status: provisional

An anchored fragment used as evidence material in Harmony or Reconstruction.

Open question:

- Is Evidence Fragment a promoted Idea Fragment, a role assigned to an Idea
  Fragment, or a separate artifact derived from Idea Fragment?

### Evidence Set

Status: provisional

A finite set of evidence materials retrieved or assembled for Harmony evaluation.

Harmony Credit is local to the Evidence Set and Candidate Space.

### Candidate Space

Status: provisional

The finite set or generated range of candidates considered during Harmony.

Harmony Credit should not be interpreted outside the Candidate Space in which it
was produced.

### Candidate Model

Status: provisional

A structured interpretation generated during Projection, Harmony, or
Reconstruction.

Examples:

- factual answer model;
- conservative hypothesis;
- bold hypothesis;
- TPCG model;
- OKF structure;
- slide narrative;
- training unit.

Open question:

- Is Candidate Model separate from Candidate Model Vector, or is the vector the
  operational form of the model?

### Model Vector

Status: provisional

A structured representation of a Candidate Model in a parameter space selected by
Projection, Skeleton Family, or another policy.

Model Vector supports statistical comparison, completion, synthesis, and
hypothesis handling.

### Evidence Vector

Status: provisional

A representation of an Evidence Fragment in the same or compatible parameter
space as a Model Vector.

Evidence Vectors may be incomplete. Missing dimensions should remain explicit.

### Operational Prior

Status: provisional

A process-specific prior derived from Domain Distribution and Projection.

Working flow:

```text
Domain Boundary
  -> Domain Distribution
  -> Projection
  -> Operational Prior
  -> Retrieve / Harmony / Reconstruction
```

Open question:

- Which process owns the creation and storage of Operational Prior?

### Skeleton Precursor

Status: provisional but important

A domain-neutral or mostly domain-neutral local signal that can help activate
Micro Skeletons or later intellectual-activity structures.

Examples:

- time expression;
- quantity expression;
- comparison marker;
- condition marker;
- uncertainty marker;
- evidence marker;
- limitation marker.

Working position:

- Skeleton Precursors should remain as domain-neutral as practical.

### Micro Skeleton

Status: provisional

A local bootstrap pattern around Skeleton Precursors.

Working position:

- Micro Skeleton types should remain mostly domain-neutral.
- Their application may be weighted by Projection or Domain Context.

### Skeleton Family

Status: provisional

A reusable intellectual-activity structure.

Examples:

```text
Observation -> Evidence -> Assessment -> Recommendation
Claim -> Support -> Counterpoint -> Revision
Problem -> Constraint -> Option -> Decision
Cause -> Effect -> Condition -> Intervention
```

Working position:

- Skeleton Family definitions should remain as domain-neutral as practical.
- Domain should mainly affect slot expectations and operational priors.

## 4. Legacy / Avoid in New Text

### Harmony Score

Status: legacy as general term

Use **Harmony Credit** instead.

Allowed use:

- historical references;
- file names not yet renamed;
- numeric sub-score or implementation-level score component.

### Local Confidence

Status: legacy

Use **fragment_quality** instead.

Avoid treating detector outputs, anchors, or labels as one generic confidence
probability.

## 5. Current Open Vocabulary Questions

These terms still need boundary discussion:

1. Generate vs Creation.
2. Idea Fragment vs Evidence Fragment vs Element.
3. Candidate Model vs Candidate Model Vector.
4. Evidence Landscape generation timing.
5. Domain Distribution as standalone artifact vs part of Domain Context.
6. Operational Prior ownership and persistence.
7. Whether Skeleton Family can have domain-specific extensions.
8. Whether decimal Harmony Credit values should be user-visible.

## 6. Cleanup Rule

When updating v0.3.0 notes:

- Use this glossary as the preferred vocabulary source.
- Replace general `Harmony Score` wording with `Harmony Credit`.
- Replace `Local Confidence` with `fragment_quality`.
- Keep unresolved terms marked as provisional rather than over-normalizing them.
- Preserve open questions in `README.md` until explicitly resolved.
