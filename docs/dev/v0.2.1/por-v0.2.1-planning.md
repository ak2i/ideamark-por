# POR v0.2.1 Planning — Precursor-based Reconstruction Front-end

Status: draft for design discussion
Baseline: `docs/dev/v0.2.0/por-m1-text-to-ideamark.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose shift

v0.2.0 treated POR M1 as a text-to-IdeaMark generator. The first local
Qwen3 4B run showed that local extraction can produce many useful matches, but
also exposed a conceptual issue: the emitted IdeaMark should not be understood
as a completed meaning object.

v0.2.1 defines POR as a **Knowledge Reconstruction Front-end**.

POR does not try to finalize knowledge. POR builds an anchored annotation index
that supports later retrieval and reconstruction. This shifts the optimization
criterion:

- front-end extraction favors recall over precision;
- annotations must preserve source anchors;
- noisy or redundant fragments are acceptable if they improve later retrieval;
- expensive reasoning is deferred to reconstruction phases;
- clusters are retrieval neighborhoods or reconstruction candidates, not the
  default unit of entity creation.

## 2. IR framing

IdeaMark is treated as an intermediate representation for intellectual activity,
not as the final knowledge product. POR is the front-end that lowers Original
Sources into an IdeaMark-compatible annotation index.

```text
Original Source
  -> Source Adapter
  -> Source Structure
  -> Skeleton Precursors
  -> Micro Skeletons
  -> Idea Fragments
  -> IdeaMark Annotation Index
  -> Projection / Reconstruction
  -> TPCG, OKF, slides, video, training, reports, etc.
```

This is analogous to compiler front-end stages. A later Projection may produce a
TPCG model, an OKF document, a slide deck, a video script, or a training unit.
The front-end should preserve reconstructable material rather than prematurely
collapsing it into one final structure.

## 3. Core concepts

### 3.1 Skeleton Precursor (SP)

A Skeleton Precursor is a cheap, local signal that suggests an intellectual
activity may begin nearby.

It is not a Skeleton. It does not assert a final meaning. It is closer to a
biological precursor signal: it marks a possible start point or activation site.

Examples:

- time expression: `正午`, `2026年登山シーズンの中盤`
- quantity expression: `3000人`, `2時間`, `七日間`
- comparison marker: `比較`, `増減`, `A/B`
- condition marker: `場合`, `時`, `なら`, `if`
- uncertainty marker: `可能性`, `偏り`, `一致しない`
- action marker: `行う`, `作る`, `確認する`, `検証する`
- reference marker: `前節`, `上図`, `次回会議`, `field memo 01-01`
- heading marker: `Observation:`, `Evidence:`, `Recommendation:`

SP detection must be fast and recall-oriented. It can be rule-based, tiny-model
based, LLM-based, or hybrid.

### 3.2 Micro Skeleton (MS)

A Micro Skeleton is a local bootstrap pattern around one or more SPs. It answers
questions such as:

- what kind of local structure is starting here?
- where is the body of the structure?
- does the body appear after the trigger, before the trigger, around it, or
  outside the current source unit?
- how far should the fragment grow before it loses reproducibility?

MS is still not the final Reconstruction Skeleton. It is an extraction-time
pattern used to form fragments.

Suggested MS attributes:

| Field | Meaning |
| --- | --- |
| `micro_type` | local pattern type, such as `measurement_statement`, `condition_clause`, `recommendation_phrase` |
| `growth_direction` | `forward`, `backward`, `enclosing`, `outward`, `external` |
| `scope_rule` | how to determine fragment span: sentence, paragraph, heading body, table row, fixed window, referenced region |
| `anchor_policy` | exact, approximate, external, inferred-from-structure |
| `confidence_hint` | optional detector-local confidence |

### 3.3 Idea Fragment

An Idea Fragment is the minimum reconstructable annotation material produced
from SP and MS processing.

A fragment must carry source anchors. It may carry weak or uncertain labels.
It should be small enough to retrieve and reprocess, but large enough that a
later system can reproduce why it was selected.

Required fragment properties:

- `fragment_id`
- `source_id`
- `source_unit_id`
- absolute source/unit offsets
- line range where available
- local source structure reference
- fragment text or source span reference
- detected SP list
- detected MS list
- optional slot candidate hints
- detector provenance

### 3.4 Skeleton Affordance

Skeleton Affordance is not directly dictionary-defined in v0.2.1.

SPs and MSs do not say which higher-level intellectual activity must occur.
They mark locations where such activity may be afforded. Projection and later
reconstruction discover affordances from fragment combinations, user purpose,
domain context, and downstream models.

This avoids attempting to maintain a complete dictionary of all possible
intellectual activities.

## 4. Source Adapter and Source Structure

The Source Adapter is responsible for reading the file or media form. The Source
Structure represents content-internal structure that can guide chunking and
fragment growth.

A text adapter may emit:

- headings
- paragraphs
- list items
- table-like rows
- sentence candidates
- line ranges
- fixed windows

A video or audio adapter may later emit:

- time ranges
- speaker turns
- subtitle spans
- scene boundaries
- captions
- OCR regions

Source Structure is not treated as truth. It is a set of boundary hints.
Projection and detector policy decide how strongly to use them.

## 5. Detector plugin architecture

v0.2.1 introduces detector plugins. Each plugin should implement one or more of
these roles:

1. `source-structure-detector`
2. `sp-detector`
3. `ms-detector`
4. `fragment-builder`
5. `slot-candidate-mapper`

Initial detector classes:

| Detector | Purpose | Expected speed | Notes |
| --- | --- | --- | --- |
| `rule` | regex/cue based SP detection | very fast | first fast-mode target |
| `tiny-classifier` | ONNX/TinyBERT-style cue classification | fast | good for ambiguity reduction |
| `ollama-small` | small local LLM detector | medium | use for MS or fragment judgment, not full JSON generation |
| `ollama-quality` | larger local LLM | slow-medium | higher quality local reconstruction support |
| `openai-compatible` | remote or local OpenAI-compatible endpoint | variable | quality or batch modes |

Detector output should be easy to parse. LLM detector output should not require
large nested JSON contracts for SP/MS stages. Tagged text or TSV-style output is
acceptable when deterministic parsing is more robust.

## 6. Relationship to Skeleton Family

Skeleton Family remains the Reconstruction Skeleton layer.

v0.2.1 does not replace existing Skeleton Families. Instead, Skeleton Families
may declare what kinds of fragments or precursor patterns are useful for their
slots.

Example sketch:

```yaml
slot: evidence_item
accepts_fragments:
  any_of:
    - measurement_statement
    - observation_statement
    - evidence_list_item
    - comparison_statement
preferred_precursors:
  - quantity
  - time
  - observation_heading
  - evidence_heading
```

This is a requirement and weighting interface, not a complete dictionary of
meaning. It helps the slot mapper and reconstruction stages decide which
fragments may fill which slots.

## 7. Projection controls

Projection should be able to steer front-end behavior without turning POR into a
completed knowledge generator.

Candidate controls:

```yaml
decomposition_guidance:
  resolution: fine | balanced | coarse
  recall_bias: low | medium | high
  boundary_policy:
    prefer: [heading, paragraph, sentence]
    allow_cross_boundary: true
  fragment_policy:
    max_fragment_chars: 800
    prefer_source_structure: true
  detector_policy:
    mode: fast | balanced | quality
    sp_detector: rule
    ms_detector: ollama-small
```

## 8. Runtime modes

### 8.1 Fast mode

Goal: produce a useful annotation index quickly.

- rule or tiny-classifier SP detection
- deterministic fragment building from Source Structure
- no full JSON LLM output
- high recall and higher noise tolerance
- target: approximately one minute for a text source on the order of 100k chars
  on a local workstation, subject to implementation and hardware

### 8.2 Balanced mode

Goal: improve fragment quality while remaining local-first.

- rule/tiny SP detection
- local small LLM for MS judgment or ambiguous fragments only
- deterministic mapping to internal JSON
- local LLM output may use tagged text or TSV rather than nested JSON

### 8.3 Quality mode

Goal: better reconstruction candidates.

- larger local or remote model
- larger chunks permitted
- richer MS/fragment reasoning
- optional final reconstruction scoring

## 9. Local model and engine plan

The current local baseline is Ollama with Qwen3 4B. For v0.2.1, smaller models
should be tested because SP/MS tasks are much smaller than full JSON match tasks.

Candidate local model sizes include Qwen3 0.6B, 1.7B, and 4B class models where
available in the runtime. The important benchmark is not chat quality; it is
SP/MS detection throughput and recoverable fragment quality.

Engines to keep compatible:

- Ollama OpenAI-compatible endpoint
- llama.cpp server / compatible local server
- LM Studio OpenAI-compatible endpoint
- optional ONNX Runtime for tiny classifiers

## 10. Benchmark baseline from first local POR run

Observed local run on the synthetic Fujisan source with Qwen3 4B:

- source length: 86,925 chars
- chunking: `--chunk-size 500 --chunk-overlap 100`
- chunks: 362
- calls: 362
- raw matches: 597
- deduped matches: 213
- matched chunks: 322
- schema errors: 80
- retry success: 71
- elapsed wall time: about 7.5 hours
- final M1 assembly collapsed into 1 cluster / 1 section / 1 entity

Interpretation:

- extraction was successful enough to validate local small-chunk matching;
- runtime is too slow for practical front-end use;
- the final assembly semantics are wrong for an annotation-index interpretation;
- v0.2.1 should prioritize fast SP/MS extraction, fragment anchoring, and
  annotation-preserving assembly.

## 11. Open design questions

1. What is the first minimal SP vocabulary for Japanese text?
2. Should SP and MS libraries be versioned independently of Skeleton Family
   libraries?
3. What fragment anchor shape should be emitted into IdeaMark Core versus kept
   in the POR session directory?
4. How should noisy fragments be ranked without deleting potentially useful
   recall?
5. Should clusters become retrieval neighborhoods rather than entity emission
   units?
6. How should multiple detector outputs be merged when rule, tiny model, and LLM
   detectors disagree?
7. What is the minimum local benchmark suite for v0.2.1?

## 12. Near-term implementation milestones

M1.1:

- add Source Structure records to text adapter output;
- add absolute source/unit anchors to guarded matches or resolved fragments;
- stop treating one cluster as one required Entity;
- preserve fragment-level annotation candidates.

M1.2:

- introduce SP rule detector for Japanese text;
- add fragment builder using headings, paragraphs, and sentence-like spans;
- emit SP/MS/fragment session artifacts.

M1.3:

- add local detector plugin interface;
- support Ollama small-model detector mode;
- benchmark Qwen3 0.6B / 1.7B / 4B class models where available.

M1.4:

- add Projection controls for resolution, recall bias, boundary policy, and
  detector policy;
- compare projections over the same source using fragment distributions.
