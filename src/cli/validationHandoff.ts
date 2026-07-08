import { spawnSync } from "node:child_process";
import type { ValidationDiagnostic, ValidationResult } from "../types.js";

// cli_validation_handoff (spec §10): run `ideamark validate` (ndjson output),
// parse diagnostics, and map them back to known candidate/section ids.

function parseNdjson(raw: string, knownIds: string[]): {
  diagnostics: ValidationDiagnostic[];
  errorCount: number;
  warningCount: number;
  summaryOk: boolean | null;
} {
  const diagnostics: ValidationDiagnostic[] = [];
  let errorCount = 0;
  let warningCount = 0;
  let summaryOk: boolean | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (entry.type === "summary") {
      summaryOk = entry.ok === true;
      if (typeof entry.error_count === "number") errorCount = entry.error_count;
      if (typeof entry.warning_count === "number") warningCount = entry.warning_count;
      continue;
    }
    if (entry.type !== "diagnostic") continue;
    const message = typeof entry.message === "string" ? entry.message : "";
    const objectId = typeof entry.object_id === "string" ? entry.object_id : undefined;
    const haystack = `${message} ${objectId ?? ""} ${typeof entry.path === "string" ? entry.path : ""}`;
    diagnostics.push({
      severity: typeof entry.severity === "string" ? entry.severity : "unknown",
      code: typeof entry.code === "string" ? entry.code : "unknown",
      message,
      path: typeof entry.path === "string" ? entry.path : undefined,
      object_id: objectId,
      related_ids: knownIds.filter((id) => haystack.includes(id)),
    });
  }
  return { diagnostics, errorCount, warningCount, summaryOk };
}

export function runValidation(
  cliPath: string | null,
  draftPath: string,
  knownIds: string[],
): ValidationResult {
  if (!cliPath) {
    return {
      status: "cli_not_found",
      error_count: 0,
      warning_count: 0,
      diagnostics: [],
      raw: "",
    };
  }

  const result = spawnSync(cliPath, ["validate", draftPath], {
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.error) {
    return {
      status: "cli_error",
      cli_path: cliPath,
      error_count: 0,
      warning_count: 0,
      diagnostics: [],
      raw: String(result.error),
    };
  }

  const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const parsed = parseNdjson(result.stdout ?? "", knownIds);
  const ok =
    parsed.summaryOk !== null ? parsed.summaryOk : result.status === 0;

  return {
    status: ok ? "ok" : "failed",
    cli_path: cliPath,
    exit_code: result.status ?? -1,
    error_count: parsed.errorCount,
    warning_count: parsed.warningCount,
    diagnostics: parsed.diagnostics,
    raw,
  };
}
