import assert from "node:assert/strict";
import { test } from "node:test";
import { loadProjection } from "../src/projection/projectionLoader.js";
import { compileExtractionTasks } from "../src/projection/runtimeCompiler.js";
import { loadFamilyLibrary } from "../src/projection/skeletonFamilyRegistry.js";

const FIXTURE = new URL("./fixtures/observation-projection.yaml", import.meta.url)
  .pathname;
const SAMPLE_LIBRARY = new URL(
  "../docs/specs/V1.2.0/sample/projections.yaml",
  import.meta.url,
).pathname;

test("built-in family library loads with canonical slots", () => {
  const library = loadFamilyLibrary("default");
  assert.ok(library.families.length >= 8);
  const evidence = library.families.find(
    (f) => f.id === "skeleton-family://samples/evidence-supported-decision/v0",
  );
  assert.ok(evidence);
  assert.equal(evidence.canonical_slots.length, 6);
});

test("single projection file loads the M1 subset", () => {
  const { projection } = loadProjection(FIXTURE);
  assert.equal(projection.id, "projection://test/observation-to-recommendation/v0");
  assert.equal(projection.uses_skeleton_families.length, 1);
  assert.deepEqual(projection.decomposition_guidance?.entity_focus, [
    "observation_or_measurement",
    "interpretation",
    "recommendation",
  ]);
});

test("projection library requires --projection-id when ambiguous", () => {
  assert.throws(
    () => loadProjection(SAMPLE_LIBRARY),
    /pass --projection-id/,
  );
  assert.throws(
    () => loadProjection(SAMPLE_LIBRARY, "projection://does-not-exist"),
    /not found/,
  );
  const { projection } = loadProjection(
    SAMPLE_LIBRARY,
    "projection://samples/design-tradeoff-analysis/v0",
  );
  assert.equal(projection.uses_skeleton_families.length, 2);
});

test("compiler maps canonical slots, marks focus, and flags unknown keys", () => {
  const library = loadFamilyLibrary("default");
  const { projection } = loadProjection(FIXTURE);

  // add a bogus mapping key to trigger the warning path
  projection.uses_skeleton_families[0].slot_mapping.not_a_real_slot = "whatever";

  const { tasks, warnings } = compileExtractionTasks(projection, library);
  assert.equal(tasks.length, 1);
  const task = tasks[0];
  assert.equal(task.slots.length, 6);

  const recommendation = task.slots.find(
    (s) => s.slot === "recommendation_or_decision",
  );
  assert.ok(recommendation);
  assert.equal(recommendation.mapped_slot, "recommendation");
  assert.equal(recommendation.focus, true);

  const question = task.slots.find((s) => s.slot === "decision_or_question");
  assert.ok(question);
  assert.equal(question.focus, false);

  assert.ok(warnings.some((w) => w.code === "unknown_slot_mapping_key"));
});

test("compiler errors on unknown family ref", () => {
  const library = loadFamilyLibrary("default");
  const { projection } = loadProjection(FIXTURE);
  projection.uses_skeleton_families[0].ref = "skeleton-family://nope/v0";
  assert.throws(
    () => compileExtractionTasks(projection, library),
    /unknown skeleton family/,
  );
});
