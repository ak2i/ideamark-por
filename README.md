# ideamark-por

Stateful POR (Progressive Occurrence Resolution) engine for generating IdeaMark documents from large or streaming inputs.

## Positioning

- `ideamark-core`: concept, spec, official templates (target: IdeaMark Core v1.2.0)
- `ideamark-cli`: canonical stateless document operations (`describe`, `validate`, `format`, `lint`, ...)
- `ideamark-por`: stateful POR engine with session management, scoring, and progressive candidate assembly

`ideamark-por` sits above `ideamark-cli` and uses it as the canonical handoff path for validation.

## M1 — Text-to-IdeaMark prototype

The current milestone (M1) takes one large text source, one Projection, the
built-in default Skeleton Family Library, and a local LLM, extracts skeleton
slot matches from overlapping chunks, mechanically assembles a rough IdeaMark
Core v1.2.0 draft, and validates it with `ideamark-cli`.

- Plan: `docs/dev/v0.2.0/por-v0.2.0-planning.md`
- Frozen M1 contract: `docs/dev/v0.2.0/por-m1-text-to-ideamark.md`

### Usage

```bash
npm install
npm run build

# inspect which family/slot extraction tasks would run (no LLM calls)
node dist/main.js plan \
  --source ./large-source.txt \
  --projection ./projection.yaml

# generate a Core draft with a local OpenAI-compatible endpoint
# (Ollama default: http://localhost:11434/v1)
node dist/main.js generate \
  --source ./large-source.txt \
  --projection ./projection.yaml \
  --llm-provider local --llm-model llama3.1 \
  --out ./generated.ideamark.yaml

# offline dry run with the deterministic mock provider
node dist/main.js generate \
  --source ./large-source.txt \
  --projection ./projection.yaml \
  --llm-provider mock \
  --out ./generated.ideamark.yaml
```

`--projection` accepts a single Projection file or a Projection Library file
(add `--projection-id` when the library holds more than one Projection, e.g.
`docs/specs/V1.2.0/sample/projections.yaml`).

Each run writes a session directory (`<out>.por-session/` by default) holding
raw guarded LLM outputs, clusters, candidates, run metadata, and
`ideamark validate` diagnostics — POR-owned state that is never required for
Core document validity.

### Development

```bash
npm run check   # typecheck src + tests
npm test        # node:test suite (unit + mock-provider e2e)
npm run dev     # run the CLI from source (tsx)
```

## Goals

- Handle long and complex inputs incrementally
- Maintain POR session state across iterations
- Support bridge/orchestrator-driven workflows
- Produce final outputs through `ideamark-cli`

## Non-goals (initial)

- Replacing `ideamark-cli`
- Owning the IdeaMark format specification
- One-shot authoring as the primary path
