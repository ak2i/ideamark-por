# POR v0.3.0 Design Hypothesis — Role Emergence Principle

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/por-v0.3.0-three-process-model.md`
- `docs/dev/v0.3.0/por-v0.3.0-domain-distribution.md`
- `docs/dev/v0.3.0/por-v0.3.0-evidence-landscape.md`
- `docs/dev/v0.3.0/por-v0.3.0-harmony-score-flow.md`
- `docs/dev/v0.3.0/por-v0.3.0-design-pattern-principles.md`
Target Core spec: `ideamark-core-v1.2.0`

## 1. Purpose

This document records the **Role Emergence Principle** for IdeaMark POR and the
v0.3.0 theory notes.

The central idea is:

> Projection, Domain Context, and IdeaMark should remain process-neutral
> structures. Their runtime roles are assigned by the process in which they are
> used: Creation, Retrieve, Reconstruction, Harmony, or another later process.

This keeps the structures reusable in practical systems while still allowing
them to function differently in different execution contexts.

## 2. Principle

The principle can be stated as:

```text
Structure is process-neutral.
Role emerges from process.
```

In other words, the system should avoid defining separate structural objects such
as:

```text
Creation Projection
Retrieve Projection
Reconstruction Projection

Creation Domain Context
Retrieve Domain Context
Reconstruction Domain Context
```

Instead, it should define reusable structures:

```text
Projection
Domain Context
IdeaMark Document
```

and let the execution process assign their operational roles.

## 3. Why This Matters

If a structure is split by process role, practical reuse becomes harder.

For example, if Domain Context is represented separately as Creation Domain,
Retrieve Domain, and Reconstruction Domain, then cross-domain reuse requires
creating, translating, or synchronizing multiple domain objects.

That is not the intended model.

The intended model is:

```text
one Domain Context description
  -> used by Creation as index construction context
  -> used by Retrieve as population / prior / search parameter context
  -> used by Reconstruction as expression adaptation context
```

The same is true for Projection.

```text
one Projection description
  -> used by Creation as Index Construction Policy
  -> used by Retrieve as Query / Retrieval Policy
  -> used by Reconstruction as Material Processing Direction
```

The role is real, but it is not encoded by multiplying the structure.

## 4. Why Process Neutrality Is a Design Pattern

Process neutrality is not only an abstraction technique. It is an IdeaMark design
pattern for reducing future implementation and communication costs.

### 4.1 Future processes are not yet known

Creation, Retrieve, Reconstruction, and Harmony may not be the complete process
set.

Future systems may add Review, Compare, Simulate, Teach, Audit, Plan, Execute, or
other processes.

If Projection, Domain Context, and IdeaMark Document remain process-neutral, a
new process can use an existing structure directly and assign a new role without
requiring a new structural type.

```text
Stable process-neutral structure
  + newly introduced process
  -> newly assigned runtime role
```

### 4.2 Structures become shared vocabulary

A process-neutral structure can be selected and applied directly in a new scene.

The results of using the same structure can accumulate around it:

- what was created from it;
- what was retrieved with it;
- what was reconstructed from it;
- what succeeded or failed;
- what additional context was required;
- what process-specific supplements were useful.

As those results accumulate, the structure becomes a common topic and shared
vocabulary for people, tools, and LLMs.

This can substantially reduce communication cost because participants can refer
to the same Projection, Domain Context, or IdeaMark Document rather than
re-explaining the whole scene.

### 4.3 Optional extensions are acceptable

Process-neutral does not mean every structure must contain all information needed
by every process.

The preferred pattern is:

```text
process-neutral structure
  + optional extension
  + process parameters
  + traceable supplementation
  -> process input
```

A process may read an extension it understands. Other processes may ignore that
extension and continue to use the common structure.

### 4.4 LLM-assisted supplementation lowers the cost

LLMs and related tools make it comparatively inexpensive to inspect a structure
and determine:

- what is missing for the current scene;
- which fields can be used as-is;
- what additional context should be requested;
- what assumptions or optional supplements should be recorded.

This makes stable shared structures more practical than prematurely creating
separate process-specific structures.

## 5. Projection as a Process-Neutral Structure

Projection is a structural description of how knowledge should be viewed,
selected, decomposed, weighted, or reconstructed.

It can be used in different processes:

| Process | Projection role |
| --- | --- |
| Creation | Index Construction Policy |
| Retrieve | Query / Retrieval Policy |
| Reconstruction | Material Processing Direction |
| Harmony | Candidate evaluation / weighting policy |

These roles should be interpreted as process roles, not separate Projection
kinds.

Example:

```yaml
projection:
  id: PROJ-001
  purpose: explain_agricultural_pharmacology_to_municipal_land_reallocation_staff
  decomposition_guidance:
    resolution: balanced
    recall_bias: high
  domain_policy:
    accepted_modes: [explicit_domain, emergent_distribution, hybrid]
  reconstruction_policy:
    epistemic_mode: conservative_inference
    expression_target: municipal_staff_explanation
```

The same Projection may be used by different processes. Each process reads the
parts relevant to its role and may ignore unrelated optional extensions.

## 6. Domain Context as a Process-Neutral Structure

Domain Context is a description of the population, convention, distribution, or
knowledge-space boundary being used.

It should not be split into separate structural types for Creation, Retrieve, and
Reconstruction.

Example:

```yaml
domain_context:
  id: DCTX-001
  mode: hybrid
  explicit_domain:
    label: agricultural_pharmacology
    declared_by: organization
  distribution:
    population: ideamark_documents
    snapshot_id: DOMDIST-001
```

Its role changes by process:

| Process | Domain Context role |
| --- | --- |
| Creation | helps construct a projection-dependent IdeaMark index |
| Retrieve | acts as a semantically important search / exploration parameter |
| Reconstruction | helps adapt expression, terminology, and explanation style |
| Harmony | helps interpret the finite candidate space and operational prior |

The structure is the same. The process determines the role.

## 7. Domain Is Semantically Heavy but Operationally a Parameter

Domain has substantial semantic influence in Retrieve, but it is still one
parameter among the retrieval and exploration controls.

Therefore, the retrieval process may specify Domain in multiple forms:

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
  include_domain_types: [expert_domain, operational_domain]
```

```yaml
retrieve_domain_parameter:
  mode: unrestricted
```

This supports domain-bound search, cross-domain search, domain-type search, and
unrestricted exploration without changing the Domain Context structure.

## 8. Domain Context May Be Preserved, Masked, Replaced, or Merged

A process may choose how to use Domain Context.

Especially in Retrieve, the system should support multiple policies:

```yaml
domain_usage_policy:
  mode: preserve | mask | replace | merge
```

These modes are process parameter policies, not separate Domain Context types.

### Preserve

Use Domain Context as a retrieval constraint or prior.

### Mask

Do not use the recorded Domain Context as a search constraint, while preserving
it for traceability, ranking explanation, Harmony interpretation, or later
Reconstruction.

```yaml
retrieval_context:
  domain_usage_policy:
    mode: mask
  domain_trace:
    original_domain_context_id: DCTX-AGPHARM
    masked_for_search: true
    retained_for_audit: true
```

### Replace

Use another Domain Context as the active process parameter while preserving the
original context in the trace.

### Merge

Use multiple Domain Contexts as a combined retrieval or reconstruction parameter.

## 9. Example: Agricultural Pharmacology to Municipal Land Reallocation

A typical cross-domain reuse case:

```text
Original Source:
  agricultural pharmacology report

Creation:
  Projection + Domain Context used in Creation = agricultural_pharmacology
  -> IdeaMark Document created as an index over specialist knowledge

Retrieve:
  Projection requests materials for land reallocation planning
  Domain parameter policy = mask, range, or merge
  -> retrieve agricultural, civil-engineering, land-use, and municipal-operation materials

Reconstruction:
  Projection + Domain Context used in Reconstruction = municipal_land_reallocation_staff
  -> generate an explanation that municipal staff can understand and act on
```

This does not require three different structural kinds of Domain Context.

It requires one reusable Domain Context structure whose role and usage policy are
assigned by the process.

## 10. Relationship to Domain Distribution

Domain Distribution still matters, but it should be understood as part of or
referenced by a process-neutral Domain Context description.

A Domain Context may contain:

```yaml
domain_context:
  id: DCTX-001
  mode: explicit_domain | emergent_distribution | hybrid
  explicit_domain:
    label: classical_literature_researcher_private_db
  distribution:
    population: ideamark_documents
    snapshot_id: DOMDIST-001
  usage_notes:
    official_shortcut_allowed: true
```

Creation, Retrieve, and Reconstruction can all use this same Domain Context, but
they may use it differently.

Therefore, Domain Context is not the same as process role or process parameter.

## 11. Relationship to Three-Process Model

The Three-Process Model defines distinct executions:

```text
Creation
Retrieve
Reconstruction
```

The Role Emergence Principle defines how common structures behave across those
executions and future processes:

```text
Projection      -> role assigned by process
Domain Context  -> role assigned by process
IdeaMark        -> role assigned by process
```

This clarifies why a single Projection or Domain Context can remain reusable even
though it plays different roles in different processes.

## 12. Relationship to IdeaMark Document

IdeaMark Document is also process-neutral.

Its roles include:

| Process | IdeaMark role |
| --- | --- |
| Retrieve | precomputed index |
| Reconstruction | annotation over Original Source fragments |
| Domain Distribution | structured population sample |
| Harmony / Evidence Landscape | source of candidate parameters and evidence references |
| Future process | role assigned without redefining the document type |

Again, these are process roles, not separate structural types.

## 13. Structure / Process / Parameter / Action

The working architectural hierarchy is:

```text
Structure
  -> Process
      -> Parameter
          -> Action
```

- **Structure**: Projection, Domain Context, IdeaMark Document, and other reusable
  objects.
- **Process**: Creation, Retrieve, Reconstruction, Harmony, and future workflows.
- **Parameter**: Domain usage, epistemic mode, retrieval scope, Harmony Credit
  policy, or other process controls.
- **Action**: generate, validate, search, match, rank, compose, render, persist.

This arrangement is an IdeaMark design pattern:

```text
stable structure
+ process-assigned role
+ optional parameterization
+ traceable action results
```

## 14. Design Guidance

Recommended guidance for v0.3.0:

- Do not multiply structural objects only because their runtime roles differ.
- Prefer one Projection structure used differently by process.
- Prefer one Domain Context structure used differently by process.
- Prefer one IdeaMark Document structure used differently by process.
- Allow process-specific optional extensions that other processes can ignore.
- Use LLM-assisted supplementation when a process needs missing context.
- Record process traces so later systems can inspect which role was assigned.
- Treat Domain as semantically important but operationally parameterized in
  Retrieve.
- Keep role assignment traceable, but avoid embedding process-specific role names
  as structural identity.

## 15. Process Trace Example

```yaml
process_trace:
  creation:
    projection_id: PROJ-001
    domain_context_id: DCTX-AGPHARM
    domain_usage_policy:
      mode: preserve
    role_assignments:
      projection: index_construction_policy
      domain_context: index_construction_context
      ideamark: creation_output

  retrieve:
    projection_id: PROJ-001
    domain_context_id: DCTX-AGPHARM
    domain_usage_policy:
      mode: mask
    domain_trace:
      original_domain_context_id: DCTX-AGPHARM
      masked_for_search: true
      retained_for_audit: true
    role_assignments:
      projection: query_and_retrieval_policy
      domain_context: search_parameter_context
      ideamark: precomputed_index

  reconstruction:
    projection_id: PROJ-001
    domain_context_id: DCTX-MUNICIPAL-STAFF
    domain_usage_policy:
      mode: replace
    role_assignments:
      projection: material_processing_direction
      domain_context: expression_adaptation_context
      ideamark: source_fragment_annotation
```

This example records different process roles while keeping Projection and Domain
Context process-neutral as structural objects.

## 16. Open Design Questions

1. Should `domain_usage_policy` belong to Projection, process execution metadata,
   or both?
2. How should Domain range and Domain type queries be represented?
3. How much of a masked Domain Context should remain visible for ranking and
   traceability?
4. Should Projection itself be maskable or only Domain Context?
5. How should optional extensions distinguish process hints from structural
   identity?
6. How should role assignments and supplements be represented in session artifacts
   versus IdeaMark Core documents?
7. How should cross-domain Retrieve report Domain Contexts that were combined or
   intentionally ignored?

## 17. Working Position

For v0.3.0, the recommended working position is:

- Projection is process-neutral; its role emerges from the execution process.
- Domain Context is process-neutral; its role emerges from the execution process.
- IdeaMark Document is process-neutral; its role emerges from the execution
  process.
- Process neutrality supports processes that have not yet been designed.
- Process-neutral structures can become shared vocabulary and discussion anchors,
  reducing communication cost.
- Process-specific needs should be expressed as optional extensions, parameters,
  supplementation, and traces rather than separate structural types.
- LLM-assisted supplementation makes missing-context completion comparatively
  low-cost.
- In Retrieve, Domain is semantically influential but operationally a search or
  exploration parameter.
- Retrieve may preserve, mask, replace, merge, range-select, type-select, or leave
  Domain unrestricted.
- Process traces should record role assignment and Domain parameter usage without
  turning those roles into structural identity.
- This arrangement is a core IdeaMark design pattern.

This principle keeps IdeaMark structures practical and reusable while preserving
the expressive power needed for cross-domain intellectual-activity reuse.
