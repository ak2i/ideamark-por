# POR v0.3.0 Design Hypothesis — Design Pattern Principles

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/glossary.md`
- `docs/dev/v0.3.0/por-v0.3.0-role-emergence-principle.md`
- `docs/dev/v0.3.0/por-v0.3.0-three-process-model.md`
- `docs/dev/v0.3.0/por-v0.3.0-domain-distribution.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose

This document records a design philosophy behind the v0.3.0 theory notes.

In this context, a **design pattern** is not merely a code template or an
implementation recipe. It is a reusable structural principle for intellectual
activity systems.

The central idea is:

> Stable process-neutral structures can be reused across current and future
> processes. Processes assign roles, add optional context, and perform actions
> without forcing the shared structures to become process-specific.

This is one of the main reasons Projection, Domain Context, and IdeaMark Document
should remain process-neutral.

## 2. Design Pattern as Common Reuse Structure

IdeaMark aims to reduce the cost of reusing intellectual activity.

A design pattern in this sense should:

- provide a reusable structure;
- avoid premature specialization to one process;
- allow different processes to read the same structure differently;
- support optional extensions without breaking other uses;
- become a common vocabulary for humans, tools, and LLMs.

This means the structure is not only a data container. It is also a communication
object.

When people, tools, or LLMs can point to the same Projection, Domain Context, or
IdeaMark Document and say "this is the structure we are discussing," the
communication cost is reduced.

## 3. Why Structures Should Be Process-Neutral

There are two major reasons.

### 3.1 Future Process Extensibility

The currently discussed processes are:

```text
Creation
Retrieve
Reconstruction
Harmony
```

However, these may not be all future processes.

Future IdeaMark systems may add processes such as:

- Compare;
- Review;
- Simulate;
- Translate;
- Teach;
- Negotiate;
- Audit;
- Monitor;
- Plan;
- Execute.

If Projection, Domain Context, and IdeaMark Document are defined as
process-specific structures, each new process would require new structural types
or conversions.

If they are process-neutral, a new process can use existing structures directly
and assign new process roles as needed.

### 3.2 Common Vocabulary and Communication Cost Reduction

A process-neutral structure can be picked up and reused in a new situation.

For example:

```text
A Projection created for Creation
  -> reused for Retrieve
  -> reused for Reconstruction
  -> reused for a future Review process
```

The results of using that structure can accumulate around the structure itself:

- what was created from it;
- what was retrieved with it;
- what was reconstructed from it;
- what worked;
- what failed;
- what additional context was needed;
- what process-specific supplements were useful.

This accumulation makes the structure a shared topic of discussion.

The structure becomes a common vocabulary item, not merely an internal runtime
object.

## 4. Optional Extensions Instead of Process-Specific Structures

Process-neutral does not mean every process receives all the information it wants
in advance.

A process may need additional information.

The recommended approach is:

```text
shared process-neutral structure
  + optional process-specific extension
  + process execution metadata
  -> usable process input
```

Other processes should be able to ignore extensions that are irrelevant to them.

Example:

```yaml
projection:
  id: PROJ-001
  purpose: cross_domain_explanation
  core:
    skeleton_family_refs: [claim_support_counterpoint_revision]
  optional_extensions:
    reconstruction:
      expression_target: municipal_staff_explanation
    retrieval:
      domain_usage_policy:
        mode: merge
```

The Projection remains one structure. The optional extensions can be read by the
processes that understand them and ignored by processes that do not.

## 5. LLM-Assisted Supplementation

In earlier system designs, process-specific structures were often created because
each process needed all required fields to be explicit before execution.

With LLM-assisted systems, the missing-context problem can often be handled more
cheaply.

A process can inspect a process-neutral structure and ask:

```text
What is missing for this process?
What should be supplemented?
Which optional assumptions should be requested or inferred?
Which parts are usable as-is?
```

Therefore, the design can prefer stable shared structures and rely on lightweight
supplementation when a process needs additional information.

This does not remove the need for traceability. Supplements should be recorded as
process metadata or optional extensions.

## 6. Domain as Parameter in Retrieve

Domain Context is semantically important, especially in Retrieve.

However, in the retrieval mechanism, Domain should be treated as one search or
exploration parameter among others.

This enables flexible retrieval policies:

```yaml
retrieve_domain_parameter:
  mode: fixed
  include: [agricultural_pharmacology]
```

```yaml
retrieve_domain_parameter:
  mode: range
  include: [agriculture, civil_engineering, municipal_operations]
```

```yaml
retrieve_domain_parameter:
  mode: type
  include_domain_types: [expert_domain, municipal_operations_domain]
```

```yaml
retrieve_domain_parameter:
  mode: unrestricted
```

Conceptually:

```text
Domain is semantically heavy.
Domain is operationally a parameter.
```

This distinction allows a process to respect Domain Context when useful, mask it
when cross-domain retrieval is needed, replace it when a new audience matters, or
merge it when interdisciplinary search is desired.

## 7. Relationship to Domain Masking

Domain masking is not a special exception to the system.

It is a retrieval parameter policy.

```yaml
retrieval_context:
  domain_usage_policy:
    mode: mask
  domain_trace:
    original_domain_context_id: DCTX-AGPHARM
    masked_for_search: true
    retained_for_audit: true
```

The retrieval process can ignore Domain Context as a filter while still retaining
it for audit, ranking explanation, Harmony interpretation, or later
Reconstruction.

This means cross-domain retrieval does not require deleting the original Domain
Context. It only changes how the process uses it.

## 8. Structure / Process / Parameter / Action

The emerging architectural hierarchy is:

```text
Structure
  -> Process
      -> Parameter
          -> Action
```

### Structure

Reusable, process-neutral objects.

Examples:

- Projection;
- Domain Context;
- IdeaMark Document;
- Evidence Landscape.

### Process

A named workflow that assigns roles to structures.

Examples:

- Creation;
- Retrieve;
- Reconstruction;
- Harmony;
- future processes.

### Parameter

Process-level controls that decide how a process uses structures.

Examples:

- `domain_usage_policy`;
- epistemic mode;
- Harmony Credit policy;
- landscape policy;
- retrieval scope.

### Action

Concrete operations inside a process.

Examples:

- generate;
- validate;
- persist;
- search;
- match;
- rank;
- compose;
- render.

## 9. Relationship to Design Patterns

This is the sense in which IdeaMark uses design patterns.

A design pattern is a reusable arrangement of:

```text
stable structure
+ process-assigned role
+ optional parameterization
+ traceable action results
```

This differs from ad hoc AI generation because it provides reusable traces and
shared vocabulary.

It also differs from a rigid schema because it allows future processes to reuse
existing structures without redefining them.

## 10. Working Position

For v0.3.0, the working position is:

- Projection, Domain Context, and IdeaMark Document should remain
  process-neutral.
- Process-neutrality supports future process extensibility.
- Process-neutrality also reduces communication cost because structures can serve
  as shared vocabulary and discussion anchors.
- Process-specific needs should be handled through optional extensions,
  parameters, supplementation, and process traces rather than by multiplying
  structural types.
- LLM-assisted supplementation makes this approach more practical because missing
  process-specific details can often be detected and requested at low cost.
- In Retrieve, Domain is semantically important but operationally should be
  treated as a search / exploration parameter.
- Domain masking, replacement, and merging are parameter policies, not separate
  structural types.
- This design philosophy is a core IdeaMark design pattern.
