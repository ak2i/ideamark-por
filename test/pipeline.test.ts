import assert from "node:assert/strict";
import { test } from "node:test";
import { guardLlmOutput } from "../src/llm/outputGuard.js";
import { clusterMatches, dedupMatches, scoreClusters } from "../src/pipeline/clusterer.js";
import type { ChunkWindow, ExtractionTask, ResolvedMatch } from "../src/types.js";

const task: ExtractionTask = {
  task_id: "task:test:family",
  projection_id: "projection://test/p/v0",
  family_id: "skeleton-family://test/family/v0",
  family_title: "Test Family",
  domain_hint: null,
  purpose: null,
  primary_match: null,
  entity_focus: ["mapped_a"],
  slots: [
    { slot: "slot_a", mapped_slot: "mapped_a", focus: true },
    { slot: "slot_b", mapped_slot: "mapped_b", focus: false },
  ],
};

const chunk: ChunkWindow = {
  chunk_id: "unit#u0:c0",
  source_id: "src-test",
  source_unit_id: "unit#u0",
  index: 0,
  text: "The reservoir dropped sharply. We recommend daily sampling.",
  start_offset: 100,
  end_offset: 160,
  start_line: 1,
  end_line: 1,
};

test("output guard recovers JSON from fenced output and recomputes offsets", () => {
  const raw =
    'Here is the answer:\n```json\n{"matches":[{"slot":"slot_a","mapped_slot":"mapped_a","span_text":"We recommend daily sampling.","start_offset":999,"end_offset":1000,"confidence":1.7,"match_class":"compatible","reason":"ok"}],"warnings":[]}\n```';
  const result = guardLlmOutput(raw, task, chunk);
  assert.equal(result.matches.length, 1);
  const match = result.matches[0];
  assert.equal(match.confidence, 1); // clamped
  assert.equal(match.start_offset, chunk.text.indexOf("We recommend"));
  assert.equal(
    chunk.text.slice(match.start_offset as number, match.end_offset as number),
    "We recommend daily sampling.",
  );
});

test("output guard drops unknown slots and normalizes match_class", () => {
  const raw = JSON.stringify({
    matches: [
      { slot: "nope", mapped_slot: "x", span_text: "The reservoir", confidence: 0.9 },
      { slot: "slot_b", span_text: "The reservoir dropped sharply.", confidence: 0.8, match_class: "banana" },
    ],
  });
  const result = guardLlmOutput(raw, task, chunk);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].slot, "slot_b");
  assert.equal(result.matches[0].mapped_slot, "mapped_b"); // filled from task
  assert.equal(result.matches[0].match_class, "uncertain");
  assert.ok(result.warnings.some((w) => w.code === "unknown_slot"));
  assert.ok(result.warnings.some((w) => w.code === "invalid_match_class"));
});

test("output guard throws on non-JSON so the runner can retry", () => {
  assert.throws(() => guardLlmOutput("I cannot answer that.", task, chunk));
});

function makeMatch(overrides: Partial<ResolvedMatch>): ResolvedMatch {
  return {
    slot: "slot_a",
    mapped_slot: "mapped_a",
    span_text: "the same span of text repeated verbatim here",
    start_offset: 0,
    end_offset: 10,
    confidence: 0.7,
    match_class: "compatible",
    reason: "",
    task_id: task.task_id,
    source_id: "src-test",
    source_unit_id: "unit#u0",
    chunk_id: "unit#u0:c0",
    projection_id: task.projection_id,
    family_id: task.family_id,
    unit_start: 100,
    unit_end: 145,
    support: 1,
    ...overrides,
  };
}

test("dedup merges overlapping same-slot matches and filters weak/negative ones", () => {
  const matches = [
    makeMatch({ confidence: 0.6 }),
    makeMatch({ confidence: 0.9, chunk_id: "unit#u0:c1" }), // overlap dup, higher conf
    makeMatch({ confidence: 0.2 }), // below min_match_confidence
    makeMatch({ confidence: 0.9, match_class: "negative" }), // never clustered
    makeMatch({ mapped_slot: "mapped_b", slot: "slot_b", unit_start: 500, unit_end: 540, span_text: "a totally different span about something else" }),
  ];
  const deduped = dedupMatches(matches);
  assert.equal(deduped.length, 2);
  const merged = deduped.find((m) => m.mapped_slot === "mapped_a");
  assert.ok(merged);
  assert.equal(merged.confidence, 0.9);
  assert.equal(merged.support, 2);
});

test("clustering groups nearby matches per family and scoring promotes strong clusters", () => {
  const matches = [
    makeMatch({ unit_start: 100, unit_end: 150, confidence: 0.9 }),
    makeMatch({
      mapped_slot: "mapped_b",
      slot: "slot_b",
      unit_start: 300,
      unit_end: 350,
      confidence: 0.8,
      span_text: "another nearby span",
    }),
    // far away -> separate cluster, weak
    makeMatch({
      unit_start: 90_000,
      unit_end: 90_040,
      confidence: 0.36,
      span_text: "a distant weak span",
    }),
  ];
  const clusters = clusterMatches(matches);
  assert.equal(clusters.length, 2);

  const familySlotCounts = new Map([[task.family_id, 2]]);
  scoreClusters(clusters, familySlotCounts, ["mapped_a"]);

  const strong = clusters[0];
  assert.equal(strong.members.length, 2);
  assert.ok(strong.score > 0.5, `score ${strong.score}`);
  assert.equal(strong.promoted, true);
  assert.equal(strong.score_parts.slot_coverage, 1);

  const weak = clusters[1];
  assert.equal(weak.promoted, false);
});
