#!/usr/bin/env node
// Generates test/kratos-ids-<version>.json from Kratos' text/id.go.
//
// Usage: node scripts/kratos-ids.mjs <path/to/text/id.go> <version> > test/kratos-ids-<version>.json
// Source of id.go: https://github.com/ory/kratos/blob/<version>/text/id.go
//
// id.go declares one iota block per range ("Foo ID = 1010000 + iota"); each following
// constant in the block is the next number. Base IDs (xx0000) are range markers, not
// messages; they are kept in the file and filtered by the tests.
import { readFileSync } from "node:fs";

const [file, version] = process.argv.slice(2);
if (!file || !version) {
  console.error("usage: node scripts/kratos-ids.mjs <id.go> <version>");
  process.exit(2);
}

const ids = {};
let next = null;
for (const raw of readFileSync(file, "utf8").split("\n")) {
  const line = raw.replace(/\/\/.*$/, "").trim();
  if (line.startsWith("const (")) {
    next = null;
    continue;
  }
  if (line === ")") {
    next = null;
    continue;
  }
  const start = line.match(/^([A-Za-z0-9_]+)\s+ID\s*=\s*(\d+)\s*\+\s*iota$/);
  if (start) {
    next = Number(start[2]);
    ids[String(next)] = start[1];
    next += 1;
    continue;
  }
  const member = line.match(/^([A-Za-z0-9_]+)$/);
  if (member && next !== null) {
    ids[String(next)] = member[1];
    next += 1;
  }
}

const count = Object.keys(ids).length;
if (count === 0) {
  console.error("no IDs found - wrong file?");
  process.exit(1);
}
process.stdout.write(JSON.stringify({ kratosVersion: version, source: "text/id.go", ids }, null, 2) + "\n");
console.error(`${count} IDs written`);
