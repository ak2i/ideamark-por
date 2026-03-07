# ARCHITECTURE

## Repository role

`ideamark-por` is the stateful execution layer for POR (Progressive Occurrence Resolution).

It is **not** the canonical specification repository and **not** the canonical stateless document CLI.

## Relationship to sibling repositories

### ideamark-core
Owns:
- IdeaMark concept and philosophy
- published specs
- official templates
- examples and methods

### ideamark-cli
Owns:
- canonical stateless operations on IdeaMark artifacts
- `describe`
- `validate`
- `format`
- `export`
- `breakdown`

### ideamark-por
Owns:
- POR session lifecycle
- chunk ingestion
- feature / facet accumulation
- occurrence candidate scoring
- plastic window / freeze logic
- IR / DB persistence
- orchestration-friendly status reporting

## Dependency direction

`ideamark-por` depends on:
- `ideamark-core` for spec understanding
- `ideamark-cli` for canonical export / validation handoff

`ideamark-cli` MUST NOT depend on `ideamark-por`.

## Runtime shape

Preferred initial shape:
- local process with persistent session state
- SQLite as default store
- thin Node.js/TypeScript CLI wrapper
- JSON / NDJSON machine interface
- optional server mode later
