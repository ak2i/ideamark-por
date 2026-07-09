# POR v0.3.0 Design Hypothesis — Role Emergence Principle

Status: hypothesis for theory exploration
Baseline:
- `docs/dev/v0.3.0/por-v0.3.0-three-process-model.md`
- `docs/dev/v0.3.0/por-v0.3.0-domain-distribution.md`
- `docs/dev/v0.3.0/por-v0.3.0-evidence-landscape.md`
- `docs/dev/v0.3.0/por-v0.3.0-harmony-score-flow.md`
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
  -> used by Retrieve as population / prior / mask context
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

## 4. Projection as a Process-Neutral Structure

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
parts relevant to its role.

## 5. Domain Context as a Process-Neutral Structure

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
| Retrieve | helps define, replace, mask, or merge the retrieval population |
| Reconstruction | helps adapt expression, terminology, and explanation style |
| Harmony | helps interpret the finite candidate space and operational prior |

The structure is the same. The process determines the role.

## 6. Domain Context May Be Preserved, Masked, Replaced, or Merged

A process may choose how to use Domain Context.

Especially in Retrieve, the system should support multiple policies:

```yaml
domain_usage_policy:
  mode: preserve | mask | replace | merge
```

### Preserve

Use the Domain Context recorded during Creation.

```text
Creation Domain Context: agricultural_pharmacology
Retrieve Domain Context: agricultural_pharmacology
```

This is useful for conventional domain-bound retrieval.

### Mask

Ignore or weaken the Creation Domain Context during retrieval.

```text
Creation Domain Context: agricultural_pharmacology
Retrieve: domain masked
```

This enables cross-domain retrieval because materials are not filtered only by
their original domain context.

### Replace

Use a different Domain Context for the process.

```text
Creation Domain Context: agricultural_pharmacology
Reconstruction Domain Context: municipal_land_reallocation_staff
```

This is useful when source knowledge was created in one expert domain but must be
explained to another practical audience.

### Merge

Use multiple Domain Contexts together.

```text
Retrieve Domains: agricultural_pharmacology + civil_engineering + municipal_operations
```

This is useful for interdisciplinary search and synthesis.

## 7. Example: Agricultural Pharmacology to Municipal Land Reallocation

A typical cross-domain reuse case:

```text
Original Source:
  agricultural pharmacology report

Creation:
  Projection + Domain Context = agricultural_pharmacology
  -> IdeaMark Document created as an index over specialist knowledge

Retrieve:
  Projection requests materials for land reallocation planning
  Domain usage policy = mask or merge
  -> retrieve agricultural, civil-engineering, land-use, and municipal-operation materials

Reconstruction:
  Projection + Domain Context = municipal_land_reallocation_staff
  -> generate an explanation that municipal staff can understand and act on
```

This does not require three different structural kinds of Domain Context.

It requires one reusable Domain Context structure whose role is assigned by the
process.

## 8. Relationship to Domain Distribution

Domain Distribution still matters, but it should be understood as part of a
process-neutral Domain Context description.

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

Therefore, Domain Context is not the same as process role.

## 9. Relationship to Three-Process Model

The Three-Process Model defines distinct executions:

```text
Creation
Retrieve
Reconstruction
```

The Role Emergence Principle defines how common structures behave across those
executions:

```text
Projection      -> role assigned by process
Domain Context  -> role assigned by process
IdeaMark        -> role assigned by process
```

This clarifies why a single Projection or Domain Context can remain reusable even
though it plays different roles in different processes.

## 10. Relationship to IdeaMark Document

IdeaMark Document is also process-neutral.

Its roles include:

| Process | IdeaMark role |
| --- | --- |
| Retrieve | precomputed index |
| Reconstruction | annotation over Original Source fragments |
| Domain Distribution | structured population sample |
| Harmony / Evidence Landscape | source of candidate parameters and evidence references |

Again, these are process roles, not separate structural types.

## 11. Design Guidance

Recommended guidance for v0.3.0:

- Do not multiply structural objects only because their runtime roles differ.
- Prefer one Projection structure used differently by process.
- Prefer one Domain Context structure used differently by process.
- Prefer one IdeaMark Document structure used differently by process.
- Record process traces so later systems can inspect which role was assigned.
- Allow explicit process policies to preserve, mask, replace, or merge Domain
  Contexts.
- Keep role assignment traceable, but avoid embedding process-specific role names
  as structural identity.

## 12. Process Trace Example

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
    role_assignments:
      projection: query_and_retrieval_policy
      domain_context: masked_population_context
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

## 13. Open Design Questions

1. Should `domain_usage_policy` belong to Projection, process execution metadata,
   or both?
2. How should a process decide whether Domain Context should be preserved, masked,
   replaced, or merged?
3. How much of a masked Domain Context should remain visible for traceability?
4. Should Projection itself be maskable or only Domain Context?
5. How should role assignments be represented in session artifacts versus
   IdeaMark Core documents?
6. How should cross-domain Retrieval report the Domain Contexts that were merged
   or intentionally ignored?
7. How should UI explain that the same Domain Context is being used in different
   process roles without implying that there are different domain types?

## 14. Working Position

For v0.3.0, the recommended working position is:

- Projection is process-neutral; its role emerges from the execution process.
- Domain Context is process-neutral; its role emerges from the execution process.
- IdeaMark Document is process-neutral; its role emerges from the execution
  process.
- Creation, Retrieve, and Reconstruction may assign different roles to the same
  structural object.
- Retrieve may preserve, mask, replace, or merge Domain Context to enable
  cross-domain knowledge reuse.
- Reconstruction may use a Domain Context different from the one used during
  Creation to generate expressions suited to a new audience or use context.
- Process traces should record role assignment and domain usage policy without
  turning those roles into separate structural object types.

This principle keeps IdeaMark structures practical and reusable while preserving
the expressive power needed for cross-domain intellectual-activity reuse.
