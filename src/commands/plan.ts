import { adaptTextSource } from "../adapters/textSourceAdapter.js";
import { loadProjection } from "../projection/projectionLoader.js";
import { compileExtractionTasks } from "../projection/runtimeCompiler.js";
import { loadFamilyLibrary } from "../projection/skeletonFamilyRegistry.js";
import type { PorWarning } from "../types.js";

// `ideamark-por plan` (spec §1.2): show which family/slot extraction tasks
// would run for a given source + Projection, without any LLM call.

export interface PlanOptions {
  sourcePath: string;
  projectionPath: string;
  projectionId?: string;
  skeletonFamily: string;
  format: "json" | "text";
}

export function runPlan(options: PlanOptions): number {
  const source = adaptTextSource(options.sourcePath);
  const library = loadFamilyLibrary(options.skeletonFamily);
  const { projection, warnings: projectionWarnings } = loadProjection(
    options.projectionPath,
    options.projectionId,
  );
  const { tasks, warnings: compileWarnings } = compileExtractionTasks(
    projection,
    library,
  );
  const warnings: PorWarning[] = [
    ...source.warnings,
    ...projectionWarnings,
    ...compileWarnings,
  ];

  if (options.format === "json") {
    console.log(
      JSON.stringify(
        {
          source: {
            source_id: source.source_id,
            source_uri: source.source_uri,
            char_length: source.units[0].char_length,
            line_count: source.units[0].line_count,
          },
          projection_id: projection.id,
          family_library: library.library_id,
          tasks,
          warnings,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  console.log(`source: ${source.source_id} (${source.units[0].char_length} chars, ${source.units[0].line_count} lines)`);
  console.log(`projection: ${projection.id}`);
  console.log(`family library: ${library.library_id}`);
  console.log(`tasks: ${tasks.length}`);
  for (const task of tasks) {
    console.log(`\n  ${task.task_id}`);
    console.log(`    family: ${task.family_id}`);
    for (const slot of task.slots) {
      const focus = slot.focus ? " [focus]" : "";
      console.log(`    ${slot.slot} -> ${slot.mapped_slot}${focus}`);
    }
  }
  for (const warning of warnings) {
    console.error(`warning(${warning.code}): ${warning.message}`);
  }
  return 0;
}
