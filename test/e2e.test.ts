import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { runGenerate } from "../src/commands/generate.js";

// M1 end-to-end scenario (spec §11): fixture text + fixture Projection +
// mock provider -> populated session dir + validated Core draft.

const SOURCE = new URL("./fixtures/field-report.txt", import.meta.url).pathname;
const PROJECTION = new URL("./fixtures/observation-projection.yaml", import.meta.url)
  .pathname;

test("generate produces a validated Core draft from the fixture", async () => {
  const dir = mkdtempSync(join(tmpdir(), "por-e2e-"));
  const out = join(dir, "draft.ideamark.yaml");
  const sessionDir = join(dir, "session");

  const exitCode = await runGenerate({
    sourcePath: SOURCE,
    sourceAdapter: "text",
    projectionPath: PROJECTION,
    skeletonFamily: "default",
    llmProvider: "mock",
    llmBaseUrl: "",
    llmModel: "",
    outPath: out,
    sessionDir,
    strictValidate: true, // fail the test if the emitted draft does not validate
    skipValidate: false,
  });
  assert.equal(exitCode, 0);

  // session artifacts (spec §1.3)
  for (const file of [
    "run.json",
    "tasks.json",
    "clusters.json",
    "candidates.json",
    "diagnostics.json",
    join("source", "records.json"),
  ]) {
    assert.ok(existsSync(join(sessionDir, file)), `missing session file: ${file}`);
  }

  const run = JSON.parse(readFileSync(join(sessionDir, "run.json"), "utf8"));
  assert.ok(run.stats.chunk_count >= 2, "fixture should span multiple chunks");
  assert.equal(run.stats.failed_calls, 0);

  const diagnostics = JSON.parse(
    readFileSync(join(sessionDir, "diagnostics.json"), "utf8"),
  );
  assert.equal(diagnostics.status, "ok");
  assert.equal(diagnostics.error_count, 0);

  // draft shape (spec §9)
  const draft = parse(readFileSync(out, "utf8")) as Record<string, any>;
  for (const ns of ["meta", "sources", "sections", "occurrences", "entities"]) {
    assert.ok(ns in draft, `missing namespace: ${ns}`);
  }
  assert.equal(draft.meta.spec_version, "ideamark-core-v1.2.0");
  assert.equal(draft.meta.status, "draft");
  assert.equal(
    draft.meta.projections[0].ref,
    "projection://test/observation-to-recommendation/v0",
  );
  assert.ok(draft.meta.x_por_generation.promoted_cluster_count >= 1);

  assert.equal(draft.sources.length, 1);
  assert.ok(draft.entities.length >= 1);
  assert.equal(draft.occurrences.length, draft.entities.length);

  const entityIds = new Set(draft.entities.map((e: any) => e.id));
  const occurrenceIds = new Set(draft.occurrences.map((o: any) => o.id));
  for (const occurrence of draft.occurrences) {
    assert.ok(entityIds.has(occurrence.entity));
    assert.equal(occurrence.status, "provisional");
    assert.ok(occurrence.confidence >= 0.5, "promoted clusters carry their score");
  }
  assert.ok(draft.sections.length >= 1);
  for (const section of draft.sections) {
    assert.ok(section.occurrences.length >= 1);
    for (const ref of section.occurrences) assert.ok(occurrenceIds.has(ref));
    assert.equal(section.anchors[0].type, "character_range");
  }
});

test("generate rejects non-text adapters in M1", async () => {
  const dir = mkdtempSync(join(tmpdir(), "por-e2e-"));
  const exitCode = await runGenerate({
    sourcePath: SOURCE,
    sourceAdapter: "pdf",
    projectionPath: PROJECTION,
    skeletonFamily: "default",
    llmProvider: "mock",
    llmBaseUrl: "",
    llmModel: "",
    outPath: join(dir, "draft.yaml"),
    sessionDir: join(dir, "session"),
    strictValidate: false,
    skipValidate: true,
  });
  assert.equal(exitCode, 2);
});
