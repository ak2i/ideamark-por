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

### 1.2 Vocabulary and decisions

Read these before comparing the theory notes, because some older files still
contain legacy wording.

1. `glossary.md`
   - Defines current v0.3.0 vocabulary.
   - Marks terms as standardized, provisional, or legacy.
   - Standardizes `Harmony Credit` and `fragment_quality`.

2. `por-v0.3.0-terminology-decisions.md`
   - Records resolved terminology decisions.
   - Explains why `Harmony Score` is legacy as a general term.
   - Explains why `Local Confidence` should be replaced by observable
     `fragment_quality`.

### 1.3 Core v0.3.0 theory flow

Read these next as the conceptual arc of v0.3.0.

1. `por-v0.3.0-reconstruction-front-end.md`
   - Reframes POR as a Knowledge Reconstruction Front-end.
   - Introduces Source Structure, Skeleton Precursors, Micro Skeletons, and Idea
     Fragments.
   - Establishes that POR should preserve reconstructable material instead of
     finalizing meaning.

2. `por-v0.3.0-harmony-score-flow.md`
   - Introduces the evaluation layer now standardized as **Harmony Credit** after
     candidate models exist.
   - Replaces probability-like Local Confidence with observable
     `fragment_quality` components as the preferred direction.
   - Adds Statistical Model-Vector Harmonization: Evidence Vectors, Model
     Vectors, completion, synthesis, and hypothesis handling.
   - Note: the file name and some internal legacy wording may still say Harmony
     Score until the naming cleanup is completed.

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

Use `glossary.md` as the primary vocabulary reference.

This README keeps only the short operational summary below.

### Standardized

- Creation
- Retrieve
- Reconstruction
- Role Emergence Principle
- Projection
- Domain Context
- Domain Distribution
- IdeaMark Document
- Original Source
- Harmony Credit
- fragment_quality
- Evidence Landscape

### Provisional

- Element
- Idea Fragment
- Evidence Fragment
- Evidence Set
- Candidate Space
- Candidate Model
- Model Vector
- Evidence Vector
- Operational Prior
- Skeleton Precursor
- Micro Skeleton
- Skeleton Family

### Legacy / avoid in new text

- Harmony Score as a general term; use Harmony Credit instead.
- Local Confidence; use fragment_quality instead.

## 4. Resolved Decisions

The following points have been decided for the current v0.3.0 theory track.

### 4.1 Harmony Score vs Harmony Credit

Decision:

- Use **Harmony Credit** as the formal term.
- Treat old `Harmony Score` wording as legacy unless it specifically refers to a
  numeric sub-score or implementation-level score component.
- Keep emphasizing that Harmony Credit is contextual and relative, not truth
  probability.

Rationale:

`Credit` better captures provisional contextual support within a finite Evidence
Set, Candidate Space, Evaluation Policy, Projection, and Domain context.

### 4.2 Local Confidence vs fragment_quality

Decision:

- Replace probability-like **Local Confidence** with observable
  **fragment_quality**.
- `fragment_quality` should be derived from observable components rather than
  treated as an arbitrary scalar probability.
- Numeric rollups may be produced later, but the source components should remain
  inspectable.

Rationale:

Different detectors produce different kinds of signals. LLM logprobs, TinyBERT
softmax, regex matches, source anchors, and human labels should not be collapsed
into one generic confidence value without preserving their observable basis.

### 4.3 v0.3.0 theory vs implementation scope

Decision:

- Continue discussing v0.3.0 theory until the main conceptual issues are mostly
  exhausted.
- After that, reflect the settled subset into an implementation-scope plan.
- Do not prematurely force every theory component into immediate v0.3.0
  implementation.

Rationale:

The theory notes now contain broad architectural material. Implementation scope
should be derived after the conceptual model stabilizes enough to avoid rework.

## 5. Potential Inconsistencies / Discussion Points

The following points are intentionally not resolved in this README. They should
be treated as design questions for follow-up discussion.

### 5.1 Generate vs Creation terminology

`por-v0.3.0-domain-distribution.md` uses **Generate / Retrieve / Reconstruct** in
some sections, while `por-v0.3.0-three-process-model.md` standardizes the process
names as **Creation / Retrieve / Reconstruction**.

Discussion point:

- Should `Generate` be renamed to `Creation` everywhere?
- Or should `Generate` refer specifically to generating an IdeaMark Document,
  while `Creation` is the broader process that includes domain trace, source
  anchoring, and persistence?

### 5.2 One Projection or process-specific Projection profiles

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

### 5.3 Domain Context as process-neutral vs process-specific examples

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

### 5.4 Domain use in Creation vs Domain masking in Retrieve

The newer model allows Creation to use Domain Context while Retrieve may mask,
replace, or merge Domain Context to enable cross-domain retrieval.

`por-v0.3.0-domain-distribution.md` currently emphasizes that Retrieval operates
over Domain Distribution and preserves Domain context.

Discussion point:

- How should `domain_usage_policy: mask` be reflected in retrieval context?
- If Retrieval masks Domain Context, what Domain trace should remain for audit,
  ranking, and later Reconstruction?

### 5.5 Domain Distribution and Role Emergence

`por-v0.3.0-domain-distribution.md` treats Domain Distribution as a key concept
for Retrieval, Harmony, Evidence Landscape, and Reconstruction.

`por-v0.3.0-role-emergence-principle.md` says Domain Context is process-neutral,
and Domain Distribution should be part of that description rather than a separate
process role.

Discussion point:

- Is Domain Distribution a standalone artifact, part of Domain Context, or both?
- Should `domain_context_id` and `domain_distribution_id` always both appear in
  traces, or should Domain Context contain the distribution reference?

### 5.6 Skeleton neutrality vs Domain-informed slot expectations

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

### 5.7 POR front-end artifacts vs stored IdeaMark Document

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

### 5.8 Evidence Landscape generation timing

`por-v0.3.0-evidence-landscape.md` treats Evidence Landscape as a structure after
retrieval and Harmony evaluation.

`por-v0.3.0-three-process-model.md` lists Evidence Landscape as optional output
from Retrieve and also input to Reconstruction.

Discussion point:

- Is Evidence Landscape generated during Retrieve, during Harmony, or during
  Reconstruction preparation?
- Should there be a distinct process stage between Retrieve and Reconstruction,
  such as `Harmonize` or `Landscape Build`?

### 5.9 Candidate Model vs Model Vector vs Element

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

### 5.10 Domain comparison across landscapes

`por-v0.3.0-domain-distribution.md` says Harmony Credits from different Domain
Distributions should not be compared without Domain context.

`por-v0.3.0-role-emergence-principle.md` allows masking, replacement, and merging
of Domain Contexts.

Discussion point:

- When a Retrieval masks or merges domains, how should resulting Harmony Credits
  be compared with credits produced under preserved Domain Context?
- Should merged-domain landscapes record per-candidate source-domain traces?

### 5.11 Numeric credit and probability language

Multiple notes warn that Harmony Credit is not truth probability.

However, examples still use decimal values that can easily be read as probability
or confidence.

Discussion point:

- Should examples use ratios/counts first and only derive decimal credit values
  later?
- Should numeric fields be named `credit`, `fit`, `rank_score`, or something else
  to reduce probability-like interpretation?

## 6. Suggested Next Discussion Order

1. Standardize terminology: Creation vs Generate.
2. Define the lifecycle of Fragment / Evidence / Vector / Candidate / Element.
3. Decide the process boundary for Harmony and Evidence Landscape.
4. Decide how Domain Context masking, replacement, and merging are traced.
5. Decide what gets stored in IdeaMark Document versus POR session artifacts.
6. After theory discussion stabilizes, create the v0.3.0 implementation-scope
   plan.

## 7. Current Working Position

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
- `fragment_quality` replaces probability-like local confidence and should be
  derived from observable components.
- Evidence Landscape preserves selected and non-selected candidates so that
  Reconstruction can use winner-only, guarded, fusion, contrastive, or
  exploratory policies.
- Theory discussion should continue before deriving the v0.3.0 implementation
  scope.
- Open contradictions should be kept visible until the theory stabilizes.
