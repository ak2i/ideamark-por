#!/usr/bin/env node

import { parseArgs } from "node:util";
import { runPlan } from "./commands/plan.js";

const VERSION = "0.2.0-dev";

const HELP = `ideamark-por — progressive IdeaMark generation engine (M1)

Usage:
  ideamark-por plan --source <path> --projection <path> [options]
  ideamark-por generate --source <path> --projection <path> --out <path> [options]
  ideamark-por --help | --version

Common options:
  --source <path>            Original Source input ("-" for stdin)
  --source-adapter <name>    Source adapter (default: text)
  --projection <path>        Projection file or Projection Library file
  --projection-id <id>       Projection id when the library has several
  --skeleton-family <spec>   "default" (built-in) or a family library path

plan options:
  --format <json|text>       Output format (default: text)

generate options:
  --out <path>               Output IdeaMark Core draft path (required)
  --session-dir <path>       Session directory (default: <out>.por-session/)
  --llm-provider <name>      local | mock (default: local)
  --llm-base-url <url>       OpenAI-compatible base URL
  --llm-model <name>         Model name
  --doc-id <id>              Document id for meta.document_id
  --max-chunks <n>           Process at most n chunks (testing)
  --chunk-size <n>           Chunk window size in characters
  --chunk-overlap <n>        Chunk overlap size in characters
  --ideamark-cli <path>      Explicit ideamark CLI path
  --strict-validate          Exit non-zero when validation fails
  --skip-validate            Skip ideamark-cli validation

See docs/dev/v0.2.0/por-m1-text-to-ideamark.md for the M1 contract.
`;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(2);
}

function parsePositiveIntOption(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") fail(`${name} must be a positive integer`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || String(parsed) !== value.trim()) {
    fail(`${name} must be a positive integer`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    console.log(HELP);
    return;
  }
  if (argv[0] === "--version") {
    console.log(VERSION);
    return;
  }

  const command = argv[0];
  const rest = argv.slice(1);

  const { values } = parseArgs({
    args: rest,
    options: {
      source: { type: "string" },
      "source-adapter": { type: "string", default: "text" },
      projection: { type: "string" },
      "projection-id": { type: "string" },
      "skeleton-family": { type: "string", default: "default" },
      format: { type: "string", default: "text" },
      out: { type: "string" },
      "session-dir": { type: "string" },
      "llm-provider": { type: "string", default: "local" },
      "llm-base-url": { type: "string" },
      "llm-model": { type: "string" },
      "doc-id": { type: "string" },
      "max-chunks": { type: "string" },
      "chunk-size": { type: "string" },
      "chunk-overlap": { type: "string" },
      "ideamark-cli": { type: "string" },
      "strict-validate": { type: "boolean", default: false },
      "skip-validate": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  if (command === "plan") {
    if (!values.source) fail("plan requires --source");
    if (!values.projection) fail("plan requires --projection");
    if (values.format !== "json" && values.format !== "text") {
      fail("--format must be json or text");
    }
    process.exit(
      runPlan({
        sourcePath: values.source,
        projectionPath: values.projection,
        projectionId: values["projection-id"],
        skeletonFamily: values["skeleton-family"] ?? "default",
        format: values.format,
      }),
    );
  }

  if (command === "generate") {
    if (!values.source) fail("generate requires --source");
    if (!values.projection) fail("generate requires --projection");
    if (!values.out) fail("generate requires --out");
    const { runGenerate } = await import("./commands/generate.js");
    const maxChunks = parsePositiveIntOption(values["max-chunks"], "--max-chunks");
    const chunkSize = parsePositiveIntOption(values["chunk-size"], "--chunk-size");
    const chunkOverlap = parsePositiveIntOption(values["chunk-overlap"], "--chunk-overlap");
    if (chunkSize !== undefined && chunkOverlap !== undefined && chunkOverlap >= chunkSize) {
      fail("--chunk-overlap must be smaller than --chunk-size");
    }
    process.exit(
      await runGenerate({
        sourcePath: values.source,
        sourceAdapter: values["source-adapter"] ?? "text",
        projectionPath: values.projection,
        projectionId: values["projection-id"],
        skeletonFamily: values["skeleton-family"] ?? "default",
        llmProvider: values["llm-provider"] ?? "local",
        llmBaseUrl:
          values["llm-base-url"] ??
          process.env.IDEAMARK_POR_LLM_BASE_URL ??
          "",
        llmModel:
          values["llm-model"] ?? process.env.IDEAMARK_POR_LLM_MODEL ?? "",
        llmApiKey: process.env.IDEAMARK_POR_LLM_API_KEY,
        outPath: values.out,
        sessionDir: values["session-dir"] ?? `${values.out}.por-session`,
        docId: values["doc-id"],
        maxChunks,
        chunkSize,
        chunkOverlap,
        strictValidate: values["strict-validate"] ?? false,
        skipValidate: values["skip-validate"] ?? false,
        ideamarkCliPath: values["ideamark-cli"],
      }),
    );
  }

  fail(`unknown command: ${command}`);
}

main().catch((err: unknown) => {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
