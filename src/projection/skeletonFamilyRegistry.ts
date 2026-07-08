import { readFileSync } from "node:fs";
import { parse } from "yaml";
import type { SkeletonFamily, SkeletonFamilyLibrary } from "../types.js";
import { BUILTIN_FAMILY_LIBRARY_YAML } from "./builtinFamilies.js";

// Loads the built-in default Skeleton Family Library, or an external one
// from a YAML file with the same `families:` list shape (spec §2.1).

function parseLibrary(yamlText: string, origin: string): SkeletonFamilyLibrary {
  const doc = parse(yamlText) as Record<string, unknown> | null;
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.families)) {
    throw new Error(`skeleton family library ${origin} has no \`families\` list`);
  }
  const families: SkeletonFamily[] = [];
  for (const [i, raw] of (doc.families as unknown[]).entries()) {
    const fam = raw as Record<string, unknown>;
    if (typeof fam?.id !== "string" || !Array.isArray(fam.canonical_slots)) {
      throw new Error(
        `skeleton family library ${origin}: families[${i}] needs \`id\` and \`canonical_slots\``,
      );
    }
    families.push({
      id: fam.id,
      title: typeof fam.title === "string" ? fam.title : fam.id,
      purpose: typeof fam.purpose === "string" ? fam.purpose : undefined,
      canonical_slots: (fam.canonical_slots as unknown[]).map(String),
      common_links: Array.isArray(fam.common_links)
        ? (fam.common_links as SkeletonFamily["common_links"])
        : undefined,
      expected_match_classes: Array.isArray(fam.expected_match_classes)
        ? (fam.expected_match_classes as unknown[]).map(String)
        : undefined,
    });
  }
  return {
    library_id:
      typeof doc.library_id === "string" ? doc.library_id : `library:${origin}`,
    families,
  };
}

export function loadFamilyLibrary(spec: string): SkeletonFamilyLibrary {
  if (spec === "default") {
    return parseLibrary(BUILTIN_FAMILY_LIBRARY_YAML, "builtin:default");
  }
  return parseLibrary(readFileSync(spec, "utf8"), spec);
}

export function findFamily(
  library: SkeletonFamilyLibrary,
  ref: string,
): SkeletonFamily | undefined {
  return library.families.find((f) => f.id === ref);
}
