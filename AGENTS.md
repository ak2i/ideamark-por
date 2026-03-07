# AGENTS

## Human
- chooses source inputs and target outcomes
- reviews generated artifacts
- adjusts strategy when diagnostics remain open

## LLM
- interprets input chunks
- proposes entities, features, and placement candidates
- reads `describe` output to choose next actions
- does not own durable state

## Bridge / Orchestrator
- executes commands on behalf of the LLM
- passes outputs back to the LLM
- maintains loop control and retry policy

## POR Daemon / Engine
- stores session state
- updates candidate scores
- manages plastic window and freeze rules
- records diagnostics and progress
- prepares handoff to `ideamark-cli`

## ideamark-cli
- provides canonical stateless document operations
- emits `describe` guidance
- exports final IdeaMark markdown
- validates output artifacts

## Design principle

The LLM is advisory and interpretive.
The POR engine is stateful and authoritative for session state.
`ideamark-cli` is authoritative for final document shape and validation.
