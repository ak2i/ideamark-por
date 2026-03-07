# ideamark-por

Stateful POR (Progressive Occurrence Resolution) engine for generating IdeaMark documents from large or streaming inputs.

## Positioning

- `ideamark-core`: concept, spec, official templates
- `ideamark-cli`: canonical stateless document operations (`describe`, `validate`, `export`, `format`, `breakdown`)
- `ideamark-por`: stateful POR engine with session management, scoring, freeze logic, and IR/DB-backed orchestration

`ideamark-por` sits above `ideamark-cli` and uses it as the canonical handoff path for export and validation.

## Goals

- Handle long and complex inputs incrementally
- Maintain POR session state across iterations
- Support bridge/orchestrator-driven workflows
- Produce final outputs through `ideamark-cli`

## Non-goals (initial)

- Replacing `ideamark-cli`
- Owning the IdeaMark format specification
- One-shot authoring as the primary path

## Suggested first milestones

1. Session model and SQLite schema
2. `por status` and `por init`
3. `por ingest` and `por update`
4. Handoff to `ideamark-cli export/validate`
5. POR-specific describe topics
