import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { PorWarning, SourceRecord } from "../types.js";

// Normalizes one text file or stdin into a single-unit source record (spec §5).

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function hash8(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 8);
}

export function adaptTextSource(sourcePath: string): SourceRecord {
  const warnings: PorWarning[] = [];
  const isStdin = sourcePath === "-";
  const raw = isStdin
    ? readFileSync(0, "utf8")
    : readFileSync(resolve(sourcePath), "utf8");
  const text = normalize(raw);
  if (text !== raw) {
    warnings.push({
      code: "line_endings_normalized",
      message: "CRLF/CR line endings were normalized to LF",
    });
  }
  if (text.trim().length === 0) {
    warnings.push({ code: "empty_source", message: "source text is empty" });
  }

  const label = isStdin ? "stdin" : basename(sourcePath).replace(/\.[^.]+$/, "");
  const sourceId = `src-${label}-${hash8(text)}`;
  const lineCount = text.length === 0 ? 0 : text.split("\n").length;

  return {
    source_id: sourceId,
    source_uri: isStdin ? "stdin:" : pathToFileURL(resolve(sourcePath)).href,
    source_media_type: "text/plain",
    source_adapter: "text",
    title: isStdin ? "stdin" : basename(sourcePath),
    units: [
      {
        source_unit_id: `${sourceId}#u0`,
        text,
        char_length: text.length,
        line_count: lineCount,
      },
    ],
    warnings,
  };
}
