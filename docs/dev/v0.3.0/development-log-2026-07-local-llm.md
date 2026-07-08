# Development Log: Local LLM Testing and POR Evaluation

Date: 2026-07-08
Branch: `chatgpt/ollama-qwen3-provider`
Scope: IdeaMark POR v0.3.0 local LLM testing

## Summary

This note records the first local LLM testing cycle for IdeaMark POR M1 using Ollama and Qwen3 4B.

The purpose of this phase was not only to make a local model run, but to clarify how POR should distinguish model behavior, extraction results, and generated IdeaMark knowledge.

## Key design decision

`matches: []` is a valid result.

POR applies known Skeleton Families broadly. Many skeletons may not match a given source chunk. Therefore, no-hit results are normal and must not be treated as extraction errors.

The important distinction is:

- valid no-hit: `{"matches":[],"warnings":[]}`
- schema error: model output cannot be interpreted as the POR output contract
- matched result: one or more valid slot matches
- anchored warning: a match exists, but its `span_text` cannot be found verbatim in the chunk

## Output contract

The extraction output contract is intentionally strict.

Required top-level shape:

```json
{"matches":[{"slot":"...","mapped_slot":"...","span_text":"...","confidence":0.0,"match_class":"compatible","reason":"..."}],"warnings":[]}
```

Rules:

- top-level keys should be `matches` and `warnings`
- `matches` must be an array
- `matches` may be empty
- slot names must not be used as top-level keys
- `span_text` must be copied verbatim from the chunk

This allows POR to separate normal no-hit behavior from malformed model output.

## Findings from Qwen3 4B via Ollama

The model can extract useful slot matches from the sample field report.

However, without strict handling, Qwen3 4B often returns a slot-key object such as:

```json
{
  "evidence_item": ["..."]
}
```

That output contains relevant information, but it does not satisfy the POR output contract. It must be counted as a schema error and retried, not silently accepted as an empty result.

After guard changes, invalid slot-key output correctly triggers retry. Some chunks produce valid `matches` output after retry, while others still fail. This is useful diagnostic information.

## Implemented changes

### Ollama native provider

Added an `ollama` LLM provider that uses Ollama native chat API.

Intended usage:

```bash
node dist/main.js generate \
  --source test/fixtures/field-report.txt \
  --projection test/fixtures/observation-projection.yaml \
  --llm-provider ollama \
  --llm-model qwen3:4b \
  --max-chunks 2 \
  --out /tmp/draft-ollama.ideamark.yaml
```

### Raw response logging

Session output now includes raw LLM attempts under:

```text
<out>.por-session/raw/
```

Each raw record includes:

- provider
- task id
- chunk id
- attempt number
- prompt
- raw text
- guard result

Raw response logging is considered evaluation infrastructure, not merely debugging.

### Output guard behavior

The output guard now rejects model output without a top-level `matches` array.

This prevents malformed JSON shapes from being treated as successful empty extraction.

### Prompt improvements

The extraction prompt now states:

- no-hit is valid
- no-hit must use `{"matches":[],"warnings":[]}`
- top-level slot-key JSON is invalid
- `span_text` must be verbatim

### Summary and stats

The generate summary is now divided into three sections:

- LLM quality
- Extraction
- Knowledge

This reflects the pipeline nature of POR.

## Current statistics

`run.json` now includes counters such as:

- `matched_task_count`
- `no_hit_task_count`
- `matched_chunk_count`
- `no_hit_chunk_count`
- `schema_error_count`
- `retry_success_count`
- `retry_failed_count`
- `anchoring_warning_count`
- `match_class_counts`
- `slot_match_counts`
- `mapped_slot_match_counts`

These counters are intended to support POR-level evaluation, not just LLM evaluation.

## Conceptual framing

POR should be treated as an information extraction pipeline rather than a generic LLM application.

Pipeline:

```text
Source
  -> Projection
  -> Chunk
  -> Provider
  -> Output Guard
  -> Match Store
  -> Dedup
  -> Cluster
  -> Assembly
  -> Validation
```

Each stage should be observable, replaceable, and measurable.

## Evaluation axes

### LLM quality

Measures whether the model follows the output contract.

Examples:

- schema errors
- retry success
- retry failure
- anchoring warnings
- future: latency, token count, tokens/sec

### Extraction quality

Measures whether the Projection and Skeleton Family found reusable knowledge.

Examples:

- matched chunks
- no-hit chunks
- matched tasks
- no-hit tasks
- failed tasks
- slot coverage

### Knowledge generation

Measures what was finally assembled into IdeaMark.

Examples:

- raw matches
- deduped matches
- promoted clusters
- sections created
- occurrences created
- entities created

## Planned additional metrics

### Source metrics

- source unit count
- character count
- chunk count
- average chunk size
- configured overlap

### Projection metrics

- skeleton family count
- compiled task count
- searched slot count

### Provider metrics

- prompt tokens
- completion tokens
- total tokens
- elapsed time
- tokens/sec

### POR metrics

- Projection coverage
- Skeleton coverage
- Knowledge density
- promoted cluster rate
- matches per 1000 characters

## Next experiments

Use multiple document types to compare Projection and model behavior.

Candidate source types:

- RFC text
- OSS README
- OSS architecture or design document
- USGS report text
- operational manual
- research paper text

The next phase should move toward a POR Benchmark: same source, same Projection, different local/cloud LLMs; and same source/model, different Projections or Skeleton Families.

## Important lesson

The main lesson from this testing cycle is:

POR quality depends on separating these questions:

1. Did the provider follow the output contract?
2. Did the selected Skeleton Family match the source?
3. Did the pipeline produce useful reusable IdeaMark knowledge?

Those are different questions and should remain different in logs, statistics, and summaries.
