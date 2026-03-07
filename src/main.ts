#!/usr/bin/env node

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`ideamark-por

Usage:
  ideamark-por --help
  ideamark-por --version

Starter entrypoint only. Commands are intentionally not implemented yet.
`);
    return;
  }

  if (args.includes("--version")) {
    console.log("0.1.0");
    return;
  }

  console.error("Not implemented yet.");
  process.exit(2);
}

main();
