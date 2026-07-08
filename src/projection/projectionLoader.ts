import { readFileSync } from "node:fs";
import { parse } from "yaml";
import type {
  PorWarning,
  Projection,
  ProjectionFamilyUse,
  ProjectionLoadResult,
} from "../types.js";

// Loads one Projection from either a single-Projection YAML file or a
// Projection Library file (`projections:` list) plus --projection-id (spec §2.2, §3).

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map(String) : undefined;
}

function parseProjection(
  raw: Record<string, unknown>,
  origin: string,
  warnings: PorWarning[],
): Projection {
  if (typeof raw.id !== "string" || typeof raw.title !== "string") {
    throw new Error(`projection in ${origin} needs \`id\` and \`title\``);
  }
  if (!Array.isArray(raw.uses_skeleton_families) || raw.uses_skeleton_families.length === 0) {
    throw new Error(
      `projection ${raw.id} needs at least one \`uses_skeleton_families\` entry`,
    );
  }
  const uses: ProjectionFamilyUse[] = [];
  for (const [i, u] of (raw.uses_skeleton_families as unknown[]).entries()) {
    const use = u as Record<string, unknown>;
    if (typeof use?.ref !== "string") {
      throw new Error(
        `projection ${raw.id}: uses_skeleton_families[${i}] needs \`ref\``,
      );
    }
    const mapping: Record<string, string> = {};
    if (use.slot_mapping && typeof use.slot_mapping === "object") {
      for (const [k, v] of Object.entries(use.slot_mapping as Record<string, unknown>)) {
        mapping[k] = String(v);
      }
    } else {
      warnings.push({
        code: "missing_slot_mapping",
        message: `projection ${raw.id}: uses_skeleton_families[${i}] has no slot_mapping; canonical slot names will be used`,
      });
    }
    uses.push({ ref: use.ref, slot_mapping: mapping });
  }

  const guidance = (raw.decomposition_guidance ?? {}) as Record<string, unknown>;
  const retrieval = (raw.retrieval_expectations ?? {}) as Record<string, unknown>;

  return {
    id: raw.id,
    title: raw.title,
    domain_hint: typeof raw.domain_hint === "string" ? raw.domain_hint : undefined,
    purpose: typeof raw.purpose === "string" ? raw.purpose : undefined,
    uses_skeleton_families: uses,
    decomposition_guidance: {
      section_strategy:
        typeof guidance.section_strategy === "string"
          ? guidance.section_strategy
          : undefined,
      entity_focus: asStringArray(guidance.entity_focus),
    },
    retrieval_expectations: {
      primary_match:
        typeof retrieval.primary_match === "string"
          ? retrieval.primary_match
          : undefined,
      expected_outputs: asStringArray(retrieval.expected_outputs),
    },
    evaluation_tests: asStringArray(raw.evaluation_tests),
  };
}

export function loadProjection(
  path: string,
  projectionId?: string,
): ProjectionLoadResult {
  const warnings: PorWarning[] = [];
  const doc = parse(readFileSync(path, "utf8")) as Record<string, unknown> | null;
  if (!doc || typeof doc !== "object") {
    throw new Error(`projection file ${path} is not a YAML mapping`);
  }

  if (Array.isArray(doc.projections)) {
    const entries = doc.projections as Record<string, unknown>[];
    if (entries.length === 0) {
      throw new Error(`projection library ${path} has an empty \`projections\` list`);
    }
    let selected: Record<string, unknown> | undefined;
    if (projectionId) {
      selected = entries.find((p) => p.id === projectionId);
      if (!selected) {
        const ids = entries.map((p) => p.id).join("\n  ");
        throw new Error(
          `projection ${projectionId} not found in ${path}. Available:\n  ${ids}`,
        );
      }
    } else if (entries.length === 1) {
      selected = entries[0];
    } else {
      const ids = entries.map((p) => p.id).join("\n  ");
      throw new Error(
        `projection library ${path} contains ${entries.length} projections; pass --projection-id. Available:\n  ${ids}`,
      );
    }
    return { projection: parseProjection(selected, path, warnings), warnings };
  }

  return { projection: parseProjection(doc, path, warnings), warnings };
}
