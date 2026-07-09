# POR v0.3.0 Development Notes

Status: index and discussion map
Target Core spec: `ideamark-core-v1.2.0`

This directory contains two kinds of v0.3.0 notes:

1. operational notes from the local LLM / POR measurement phase;
2. theory notes that emerged from the v0.3.0 redesign discussion.

The theory notes are intentionally marked as hypotheses. They should be treated
as discussion material, not finalized specification.

## 1. Recommended Reading Order

### 1.1 Operational baseline

Read these first to understand why v0.3.0 moved beyond the initial v0.2.0 M1
implementation.

1. `development-log-2026-07-local-llm.md`
   - Records the local Ollama / Qwen3 4B testing cycle.
   - Separates LLM quality, extraction quality, and knowledge-generation quality.
   - Motivates the move away from treating M1 as direct text-to-IdeaMark
     generation.

2. `handoff-local-llm-testing.md`
   - Operational handoff for local LLM measurement.
   - Lists run commands, outputs to inspect, known leftovers, and next testing
     steps.

### 1.2 Core v0.3.0 theory flow

Read these next as the conceptual arc of v0.3.0.

1. `por-v0.3.0-reconstruction-front-end.md`
   - Reframes POR as a Knowledge Reconstruction Front-end.
   - Introduces Source Structure, Skeleton Precursors, Micro Skeletons, and Idea
     Fragments.
   - Establishes that POR should preserve reconstructable material instead of
     finalizing meaning.

2. `por-v0.3.0-harmony-score-flow.md`
   - Introduces Harmony Score / Harmony Credit as an evaluation layer after
     candidate models exist.
   - Separates local extraction confidence from model-level harmony.
   - Adds Statistical Model-Vector Harmonization: Evidence Vectors, Model
     Vectors, completion, synthesis, and hypothesis handling.

3. `por-v0.3.0-evidence-landscape.md`
   - Generalizes counter-evidence into differently directed evidence.
   - Defines Evidence Landscape as selected and non-selected candidate models,
     their relations, vector differences, and Harmony Credits.
   - Introduces winner-only, guarded-winner, fusion, contrastive, and exploratory
     reconstruction modes.

4. `por-v0.3.0-domain-distribution.md`
   - Defines Domain as an explicit or emergent population boundary over IdeaMark
     Documents.
   - Introduces Domain Distribution and Projection-specific Operational Prior.
   - Clarifies that the population is IdeaMark Documents, not Original Sources.

5. `por-v0.3.0-three-process-model.md`
   - Separates Creation, Retrieve, and Reconstruction as different execution
     processes.
   - Defines process-specific roles of Projection, IdeaMark, Original Source, and
     Elements.
   - Clarifies that IdeaMark is an index in Retrieve and an annotation layer in
     Reconstruction.

6. `por-v0.3.0-role-emergence-principle.md`
   - Defines the principle: structure is process-neutral; role emerges from
     process.
   - Keeps Projection, Domain Context, and IdeaMark Document as reusable structures
     rather than splitting them into Creation/Retrieve/Reconstruction-specific
     structural types.
   - Adds Domain usage policies: preserve, mask, replace, merge.

## 2. Conceptual Map

```text
Operational finding:
  local LLM extraction works partially, but direct text-to-IdeaMark completion is
  too slow and semantically premature.

POR v0.3.0 front-end:
  Original Source
    -> Source Structure
    -> Skeleton Precursors
    -> Micro Skeletons
    -> Idea Fragments
    -> IdeaMark Annotation Index

Creation:
  Projection + Original Source + Domain Context
    -> IdeaMark Document stored in DB

Retrieve:
  Projection + Domain Context policy + IdeaMark DB
    -> Evidence Set / Candidate Space / optional Evidence Landscape

Harmony:
  Evidence Vectors + Candidate Model Vectors
    -> Harmony Credit within a finite Candidate Space

Evidence Landscape:
  selected candidate
  + close competitors
  + counter-models
  + derivatives
  + minority hypotheses
  + unknown-dimension models

Reconstruction:
  Projection + Evidence Landscape + IdeaMark annotations + Original Source fragments
    -> expression that activates or supports Intellectual Activity
```

## 3. Working Vocabulary

### Projection

A process-neutral structure that can be used differently by process.

- In Creation: Index Construction Policy.
- In Retrieve: Query / Retrieval Policy.
- In Reconstruction: Material Processing Direction.
- In Harmony: candidate evaluation / weighting policy.

### Domain Context

A process-neutral description of a population, convention, distribution, or
knowledge-space boundary.

It may be explicit, emergent, or hybrid.

The process decides whether to preserve, mask, replace, or merge it.

### IdeaMark Document

A process-neutral structured document created from Original Source under a
Projection.

- In Retrieve: precomputed index.
- In Reconstruction: annotation over Original Source fragments.
- In Domain Distribution: structured population sample.

### Harmony Credit

A contextual, relative credit assigned inside a finite Candidate Space and
Evidence Set.

It is not truth probability.

### Evidence Landscape

A structured landscape of selected and non-selected candidate models, their
Harmony Credits, vector differences, evidence, counter-evidence, and relations.

### Element

A reconstruction-time material prepared from IdeaMark annotations and Original
Source fragments.

```text
IdeaMark annotation + Original Source fragment -> Element
```

## 4. Potential Inconsistencies / Discussion Points

The following points are intentionally not resolved in this README. They should
be treated as design questions for follow-up discussion.

### 4.1 Generate vs Creation terminology

`por-v0.3.0-domain-distribution.md` uses **Generate / Retrieve / Reconstruct** in
some sections, while `por-v0.3.0-three-process-model.md` standardizes the process
names as **Creation / Retrieve / Reconstruction**.

Discussion point:

- Should `Generate` be renamed to `Creation` everywhere?
- Or should `Generate` refer specifically to generating an IdeaMark Document,
  while `Creation` is the broader process that includes domain trace, source
  anchoring, and persistence?

### 4.2 Harmony Score vs Harmony Credit

`por-v0.3.0-harmony-score-flow.md` mostly uses **Harmony Score**, while later
notes increasingly use **Harmony Credit** to avoid implying truth probability.

Discussion point:

- Should the formal term be `Harmony Credit`, with `Harmony Score` reserved for
  numeric components?
- Or should `Harmony Score` remain the general term, with strong language stating
  that it is contextual credit, not probability?

### 4.3 Local Confidence vs observable fragment quality

`por-v0.3.0-harmony-score-flow.md` still contains local confidence examples,
such as anchor confidence, boundary confidence, and label confidence.

Later discussion suggests these should probably be derived from observable
fragment-quality components rather than treated as direct probability-like
values.

Discussion point:

- Should local confidence be renamed to `fragment_quality`, `fragment_reliability`,
  or `fragment_observability`?
- Should numeric local confidence be stored, or always derived from observable
  components?

### 4.4 One Projection or process-specific Projection profiles

`por-v0.3.0-three-process-model.md` asks whether one Projection can safely serve
Creation, Retrieve, and Reconstruction, or whether separate Projection profiles
are needed.

`por-v0.3.0-role-emergence-principle.md` says Projection should remain
process-neutral and roles should emerge from process.

Discussion point:

- Can one Projection contain optional role-specific sections while still remaining
  one process-neutral structure?
- Should a Projection file support named profiles without turning those profiles
  into separate structural types?

### 4.5 Domain Context as process-neutral vs process-specific examples

`por-v0.3.0-role-emergence-principle.md` correctly states that Domain Context
should not be split into Creation Domain, Retrieve Domain, and Reconstruction
Domain structural types.

However, some examples still use phrases such as "Creation Domain Context" or
"Reconstruction Domain Context" as shorthand.

Discussion point:

- Should examples be rewritten to say "Domain Context used in Creation" and
  "Domain Context used in Reconstruction" to avoid implying separate types?
- Should the vocabulary distinguish structural identity from process role more
  strictly?

### 4.6 Domain use in Creation vs Domain masking in Retrieve

The newer model allows Creation to use Domain Context while Retrieve may mask,
replace, or merge Domain Context to enable cross-domain retrieval.

`por-v0.3.0-domain-distribution.md` currently emphasizes that Retrieval operates
over Domain Distribution and preserves Domain context.

Discussion point:

- How should `domain_usage_policy: mask` be reflected in retrieval context?
- If Retrieval masks Domain Context, what Domain trace should remain for audit,
  ranking, and later Reconstruction?

### 4.7 Domain Distribution and Role Emergence

`por-v0.3.0-domain-distribution.md` treats Domain Distribution as a key concept
for Retrieval, Harmony, Evidence Landscape, and Reconstruction.

`por-v0.3.0-role-emergence-principle.md` says Domain Context is process-neutral,
and Domain Distribution should be part of that description rather than a separate
process role.

Discussion point:

- Is Domain Distribution a standalone artifact, part of Domain Context, or both?
- Should `domain_context_id` and `domain_distribution_id` always both appear in
  traces, or should Domain Context contain the distribution reference?

### 4.8 Skeleton neutrality vs Domain-informed slot expectations

`por-v0.3.0-three-process-model.md` recommends that Skeleton Precursor and
Skeleton Family remain as domain-neutral as practical.

At the same time, `por-v0.3.0-domain-distribution.md` says Domain Context may
help choose likely entity types, section patterns, suitable Skeleton Families,
and operational priors.

Discussion point:

- Should Skeleton Family selection be Projection-driven with Domain-informed
  priors, while Skeleton Family definitions remain domain-neutral?
- Should Domain-specific Skeleton Family extensions be allowed, or only
  Domain-specific slot expectations?

### 4.9 POR front-end artifacts vs stored IdeaMark Document

`por-v0.3.0-reconstruction-front-end.md` and
`por-v0.3.0-harmony-score-flow.md` emphasize session artifacts such as fragments,
SP/MS detections, candidate models, and harmony evaluations.

`por-v0.3.0-three-process-model.md` describes Creation as producing an IdeaMark
Document stored in the DB.

Discussion point:

- Which artifacts are persisted inside the IdeaMark Document?
- Which remain POR session artifacts?
- How should stored IdeaMark Documents reference external fragment/session
  artifacts when needed?

### 4.10 Evidence Landscape generation timing

`por-v0.3.0-evidence-landscape.md` treats Evidence Landscape as a structure after
retrieval and Harmony evaluation.

`por-v0.3.0-three-process-model.md` lists Evidence Landscape as optional output
from Retrieve and also input to Reconstruction.

Discussion point:

- Is Evidence Landscape generated during Retrieve, during Harmony, or during
  Reconstruction preparation?
- Should there be a distinct process stage between Retrieve and Reconstruction,
  such as `Harmonize` or `Landscape Build`?

### 4.11 Candidate Model vs Model Vector vs Element

The notes use several related concepts:

- Candidate Model;
- Model Vector;
- Evidence Vector;
- Element;
- Evidence Fragment;
- Idea Fragment.

Discussion point:

- What is the exact lifecycle from Idea Fragment to Evidence Fragment, Evidence
  Vector, Candidate Model Vector, Candidate Model, Element, and output claim?
- Are Candidate Models created before Elements, after Elements, or in parallel?

### 4.12 Domain comparison across landscapes

`por-v0.3.0-domain-distribution.md` says Harmony Credits from different Domain
Distributions should not be compared without Domain context.

`por-v0.3.0-role-emergence-principle.md` allows masking, replacement, and merging
of Domain Contexts.

Discussion point:

- When a Retrieval masks or merges domains, how should resulting Harmony Credits
  be compared with credits produced under preserved Domain Context?
- Should merged-domain landscapes record per-candidate source-domain traces?

### 4.13 Confidence, Credit, and probability language

Multiple notes warn that Harmony Score / Credit is not truth probability.

However, examples still use decimal values that can easily be read as probability
or confidence.

Discussion point:

- Should examples use ratios/counts first and only derive decimal scores later?
- Should numeric fields be named `credit`, `fit`, `rank_score`, or something else
  to reduce probability-like interpretation?

### 4.14 v0.3.0 theory vs implementation scope

The theory notes now describe a broad architecture involving Domain Distribution,
Evidence Landscape, Role Emergence, Model Vectors, and Reconstruction policies.

The operational notes are still grounded in local LLM extraction, output guards,
raw matches, deduplication, and M1 assembly.

Discussion point:

- Which theory components belong in the immediate v0.3.0 implementation?
- Which should remain conceptual until v0.4.0 or later?
- Should README maintain a milestone map from theory notes to implementation
  tasks?

## 5. Suggested Next Discussion Order

1. Standardize terminology: Creation vs Generate, Harmony Score vs Harmony
   Credit.
2. Define the lifecycle of Fragment / Evidence / Vector / Candidate / Element.
3. Decide the process boundary for Harmony and Evidence Landscape.
4. Decide how Domain Context masking, replacement, and merging are traced.
5. Decide what gets stored in IdeaMark Document versus POR session artifacts.
6. Decide the v0.3.0 implementation subset.

## 6. Current Working Position

The current v0.3.0 working position is:

- POR should be treated as a Knowledge Reconstruction Front-end.
- IdeaMark Documents are projection-dependent indexes created from Original
  Sources.
- Creation, Retrieve, and Reconstruction are separate processes.
- Projection, Domain Context, and IdeaMark Document should remain process-neutral
  structures.
- Their roles emerge from the process in which they are used.
- Domain can be explicit, emergent, or hybrid, and Domain Context can be
  preserved, masked, replaced, or merged by process policy.
- Harmony Credit is contextual and relative to a finite Evidence Set, Candidate
  Space, Evaluation Policy, Projection, and Domain context.
- Evidence Landscape preserves selected and non-selected candidates so that
  Reconstruction can use winner-only, guarded, fusion, contrastive, or
  exploratory policies.
- Open contradictions should be kept visible until the theory stabilizes.
