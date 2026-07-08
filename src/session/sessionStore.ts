import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Session directory writer (spec §1.3). Everything here is POR-owned state,
// never required for Core document validity.

export class SessionStore {
  constructor(readonly dir: string) {
    mkdirSync(join(dir, "matches"), { recursive: true });
    mkdirSync(join(dir, "raw"), { recursive: true });
    mkdirSync(join(dir, "source"), { recursive: true });
  }

  writeJson(relativePath: string, data: unknown): void {
    writeFileSync(join(this.dir, relativePath), JSON.stringify(data, null, 2) + "\n");
  }

  writeMatches(chunkId: string, data: unknown): void {
    const safe = safeChunkId(chunkId);
    this.writeJson(join("matches", `${safe}.json`), data);
  }

  writeRawResponses(chunkId: string, data: unknown): void {
    const safe = safeChunkId(chunkId);
    this.writeJson(join("raw", `${safe}.json`), data);
  }
}

function safeChunkId(chunkId: string): string {
  return chunkId.replace(/[^a-zA-Z0-9._-]/g, "_");
}
