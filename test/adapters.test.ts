import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { adaptTextSource } from "../src/adapters/textSourceAdapter.js";
import { chunkSource } from "../src/chunking/chunkWindowIterator.js";

const FIXTURE = new URL("./fixtures/field-report.txt", import.meta.url).pathname;

test("text adapter normalizes line endings and produces stable ids", () => {
  const dir = mkdtempSync(join(tmpdir(), "por-test-"));
  const path = join(dir, "crlf.txt");
  writeFileSync(path, "line one\r\nline two\r\nline three");

  const record = adaptTextSource(path);
  assert.equal(record.source_adapter, "text");
  assert.equal(record.source_media_type, "text/plain");
  assert.equal(record.units.length, 1);
  assert.ok(!record.units[0].text.includes("\r"));
  assert.equal(record.units[0].line_count, 3);
  assert.ok(record.warnings.some((w) => w.code === "line_endings_normalized"));
  assert.match(record.source_id, /^src-crlf-[0-9a-f]{8}$/);

  // same content -> same id
  const again = adaptTextSource(path);
  assert.equal(again.source_id, record.source_id);
});

test("chunk windows cover the whole source with overlap and consistent offsets", () => {
  const record = adaptTextSource(FIXTURE);
  const chunks = chunkSource(record);
  const text = record.units[0].text;

  assert.ok(chunks.length >= 2, `expected multiple chunks, got ${chunks.length}`);
  assert.equal(chunks[0].start_offset, 0);
  assert.equal(chunks[chunks.length - 1].end_offset, text.length);

  for (const [i, chunk] of chunks.entries()) {
    assert.equal(chunk.text, text.slice(chunk.start_offset, chunk.end_offset));
    assert.equal(chunk.chunk_id, `${record.units[0].source_unit_id}:c${i}`);
    if (i > 0) {
      // overlapping windows: each chunk starts before the previous one ends
      assert.ok(chunk.start_offset < chunks[i - 1].end_offset);
    }
  }
});

test("chunk iterator honors maxChunks", () => {
  const record = adaptTextSource(FIXTURE);
  const chunks = chunkSource(record, { maxChunks: 2 });
  assert.equal(chunks.length, 2);
});
