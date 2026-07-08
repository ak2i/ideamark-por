import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

// ideamark_cli_command_resolver (spec §10): explicit path, then local
// node_modules/.bin, then PATH. The npm package `ideamark-cli` installs
// its binary as `ideamark`.

const BIN_NAMES = ["ideamark", "ideamark-cli"];

export function resolveIdeamarkCli(explicitPath?: string): string | null {
  if (explicitPath) {
    return existsSync(explicitPath) ? explicitPath : null;
  }

  for (const name of BIN_NAMES) {
    const local = join(process.cwd(), "node_modules", ".bin", name);
    if (existsSync(local)) return local;
  }

  const pathDirs = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    for (const name of BIN_NAMES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
