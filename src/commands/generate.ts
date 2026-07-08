import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { stringify } from "yaml";
import { adaptTextSource } from "../adapters/textSourceAdapter.js";
import { chunkSource } from "../chunking/chunkWindowIterator.js";
import { resolveIdeamarkCli } from "../cli/ideamarkCliResolver.js";
import { runValidation } from "../cli/validationHandoff.js";
import type { RunConfig } from "../config.js";
import { M1_DEFAULTS } from "../config.js";
import { resolveProvider } from "../llm/providerRegistry.js";
import { buildSourceWindows } from "../pipeline/candidateBuilder.js";
import { clusterMatches, dedupMatches, scoreClusters } from "../pipeline/clusterer.js";
import { assembleCoreDraft } from "../pipeline/draftAssembler.js";
import { runExtraction } from "../pipeline/extractionRunner.js";
import { loadProjection } from "../projection/projectionLoader.js";
import { compileExtractionTasks } from "../projection/runtimeCompiler.js";
import { loadFamilyLibrary } from "../projection/skeletonFamilyRegistry.js";
import { SessionStore } from "../session/sessionStore.js";
import type { PorWarning } from "../types.js";

// `ideamark-por generate` (spec §1.1): full M1 pipeline --
// adapt -> compile -> chunk -> extract -> cluster -> assemble -> validate.

export async function runGenerate(config: RunConfig): Promise<number> {
  const startedAt = new Date().toISOString();
  const log = (line: string): void => console.error(line);
  const warnings: PorWarning[] = [];

  if (config.sourceAdapter !== "text") {
    console.error(
      `error: source adapter \`${config.sourceAdapter}\` is not available in M1 (text only)`,
    );
    return 2;
  }

  // --- Phase 1 inputs ---
  const source = adaptTextSource(config.sourcePath);
  const library = loadFamilyLibrary(config.skeletonFamily);
  const { projection, warnings: projectionWarnings } = loadProjection(
    config.projectionPath,
    config.projectionId,
  );
  const { tasks, warnings: compileWarnings } = compileExtractionTasks(
    projection,
    library,
  );
  warnings.push(...source.warnings, ...projectionWarnings, ...compileWarnings);

  const session = new SessionStore(config.sessionDir);
  session.writeJson("source/records.json", source);
  session.writeJson("tasks.json", tasks);

  // --- Phase 2: chunk + extract ---
  const chunks = chunkSource(source, {
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    maxChunks: config.maxChunks,
  });
  log(
    `source ${source.source_id}: ${source.units[0].char_length} chars -> ${chunks.length} chunk(s), ${tasks.length} task(s), provider ${config.llmProvider}`,
  );
  const provider = resolveProvider(config.llmProvider, {
    baseUrl: config.llmBaseUrl,
    model: config.llmModel,
    apiKey: config.llmApiKey,
  });
  const extraction = await runExtraction(provider, tasks, chunks, session, log);

  // --- Phase 3: dedup + cluster + score + assemble ---
  const deduped = dedupMatches(extraction.resolved);
  const clusters = clusterMatches(deduped);
  const familySlotCounts = new Map(
    library.families.map((f) => [f.id, f.canonical_slots.length]),
  );
  const entityFocus = projection.decomposition_guidance?.entity_focus ?? [];
  scoreClusters(clusters, familySlotCounts, entityFocus);
  session.writeJson("clusters.json", clusters);

  const windows = buildSourceWindows(clusters, source);
  const promoted = clusters.filter((c) => c.promoted);
  session.writeJson("candidates.json", {
    promoted_clusters: promoted.map((c) => ({
      cluster_id: c.cluster_id,
      family_id: c.family_id,
      score: c.score,
      score_parts: c.score_parts,
      member_count: c.members.length,
      span: { start: c.start, end: c.end },
    })),
    source_windows: windows,
  });

  const draft = assembleCoreDraft({
    source,
    projection,
    clusters,
    windows,
    generation: {
      provider: config.llmProvider,
      model: config.llmProvider === "mock" ? null : config.llmModel || M1_DEFAULTS.llm_model,
      chunk_count: chunks.length,
      task_count: tasks.length,
      raw_match_count: extraction.stats.raw_match_count,
    },
    docId: config.docId,
  });

  const outPath = resolve(config.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, stringify(draft, { lineWidth: 0 }));

  // --- Phase 4: validation handoff ---
  let validation = null;
  if (!config.skipValidate) {
    const cliPath = resolveIdeamarkCli(config.ideamarkCliPath);
    const knownIds = [
      ...draft.sections.map((s) => String(s.id)),
      ...draft.occurrences.map((o) => String(o.id)),
      ...draft.entities.map((e) => String(e.id)),
    ];
    validation = runValidation(cliPath, outPath, knownIds);
    session.writeJson("diagnostics.json", validation);
    if (validation.status === "cli_not_found") {
      warnings.push({
        code: "cli_not_found",
        message:
          "ideamark CLI not found (install `ideamark-cli` or pass --ideamark-cli); validation skipped",
      });
    }
  }

  session.writeJson("run.json", {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    config: { ...config, llmApiKey: config.llmApiKey ? "***" : undefined },
    stats: extraction.stats,
    defaults: M1_DEFAULTS,
    warnings,
  });

  // --- report summary (spec §10) ---
  const filtered = extraction.resolved.length - deduped.length;
  const failedTaskCount = extraction.stats.failed_calls;
  const totalTaskRuns = extraction.stats.chunk_count * extraction.stats.task_count;
  console.error("");
  console.error("=== ideamark-por generate summary ===");
  console.error(`source:      ${source.source_id} (${source.units[0].char_length} chars)`);
  console.error(`projection:  ${projection.id}`);
  console.error(`provider:    ${config.llmProvider}` + (config.llmProvider === "mock" ? "" : ` (${config.llmModel || M1_DEFAULTS.llm_model})`));
  console.error(`workload:    ${chunks.length} chunk(s), ${tasks.length} task(s), ${totalTaskRuns} task run(s)`);
  console.error("");
  console.error("LLM quality:");
  console.error(`  calls:             ${extraction.stats.call_count}`);
  console.error(`  schema errors:     ${extraction.stats.schema_error_count}`);
  console.error(`  retries:           ${extraction.stats.retry_count}`);
  console.error(`  retry success:     ${extraction.stats.retry_success_count}`);
  console.error(`  retry failed:      ${extraction.stats.retry_failed_count}`);
  console.error(`  anchor warnings:   ${extraction.stats.anchoring_warning_count}`);
  console.error("");
  console.error("Extraction:");
  console.error(`  matched chunks:    ${extraction.stats.matched_chunk_count}`);
  console.error(`  no-hit chunks:     ${extraction.stats.no_hit_chunk_count}`);
  console.error(`  matched tasks:     ${extraction.stats.matched_task_count}`);
  console.error(`  no-hit tasks:      ${extraction.stats.no_hit_task_count}`);
  console.error(`  failed tasks:      ${failedTaskCount}`);
  console.error("");
  console.error("Knowledge:");
  console.error(`  matches:           ${extraction.stats.raw_match_count} raw -> ${deduped.length} deduped (${filtered} filtered/merged)`);
  console.error(`  clusters:          ${clusters.length} total, ${promoted.length} promoted (threshold ${M1_DEFAULTS.candidate_threshold})`);
  console.error(`  namespaces:        sources=${draft.sources.length} sections=${draft.sections.length} occurrences=${draft.occurrences.length} entities=${draft.entities.length}`);
  console.error("");
  console.error(`draft:       ${outPath}`);
  if (validation) {
    console.error(
      `validation:  ${validation.status}` +
        (validation.status === "ok" || validation.status === "failed"
          ? ` (${validation.error_count} errors, ${validation.warning_count} warnings)`
          : ""),
    );
  } else {
    console.error("validation:  skipped (--skip-validate)");
  }
  console.error(`session:     ${session.dir}`);
  for (const warning of warnings) {
    console.error(`warning(${warning.code}): ${warning.message}`);
  }

  if (config.strictValidate && validation && validation.status !== "ok") {
    console.error("error: validation did not pass and --strict-validate is set");
    return 1;
  }
  return 0;
}
