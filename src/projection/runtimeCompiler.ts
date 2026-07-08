import type {
  ExtractionTask,
  PorWarning,
  Projection,
  SkeletonFamilyLibrary,
  TaskSlot,
} from "../types.js";
import { findFamily } from "./skeletonFamilyRegistry.js";

// family_selection_resolver + projection_runtime_compiler (spec §3, §4):
// resolves active families from `uses_skeleton_families` and compiles
// canonical slots + slot_mapping + entity_focus into extraction tasks.

function shortName(uri: string): string {
  const tail = uri.split("://")[1] ?? uri;
  const parts = tail.split("/").filter(Boolean);
  // drop trailing version segments like `v0`
  const last = parts[parts.length - 1];
  return /^v\d+$/.test(last) && parts.length > 1 ? parts[parts.length - 2] : last;
}

export interface CompiledPlan {
  tasks: ExtractionTask[];
  warnings: PorWarning[];
}

export function compileExtractionTasks(
  projection: Projection,
  library: SkeletonFamilyLibrary,
): CompiledPlan {
  const warnings: PorWarning[] = [];
  const tasks: ExtractionTask[] = [];
  const entityFocus = projection.decomposition_guidance?.entity_focus ?? [];
  const focusSet = new Set(entityFocus);

  for (const use of projection.uses_skeleton_families) {
    const family = findFamily(library, use.ref);
    if (!family) {
      throw new Error(
        `projection ${projection.id} references unknown skeleton family ${use.ref} (library: ${library.library_id})`,
      );
    }

    const canonical = new Set(family.canonical_slots);
    for (const key of Object.keys(use.slot_mapping)) {
      if (!canonical.has(key)) {
        warnings.push({
          code: "unknown_slot_mapping_key",
          message: `projection ${projection.id}: slot_mapping key \`${key}\` is not a canonical slot of ${family.id}; skipped`,
        });
      }
    }

    const slots: TaskSlot[] = family.canonical_slots.map((slot) => {
      const mapped = use.slot_mapping[slot] ?? slot;
      return { slot, mapped_slot: mapped, focus: focusSet.has(mapped) };
    });

    tasks.push({
      task_id: `task:${shortName(projection.id)}:${shortName(family.id)}`,
      projection_id: projection.id,
      family_id: family.id,
      family_title: family.title,
      domain_hint: projection.domain_hint ?? null,
      purpose: projection.purpose ?? null,
      primary_match: projection.retrieval_expectations?.primary_match ?? null,
      entity_focus: entityFocus,
      slots,
    });
  }

  return { tasks, warnings };
}
