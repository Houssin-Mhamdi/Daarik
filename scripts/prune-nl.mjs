import fs from "node:fs";
const en = fs.readFileSync("C:/Users/dell2/darna/src/lib/i18n/en.ts","utf8");
const enKeys = new Set([...en.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)].map(m=>m[1]));
const nlPath = "C:/Users/dell2/darna/src/lib/i18n/nl.ts";
let nl = fs.readFileSync(nlPath,"utf8");
// remove lines that are top-level key entries not in en
const lines = nl.split(/\r?\n/);
const out = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/^\s{2}([A-Za-z0-9_]+):/);
  if (m && !enKeys.has(m[1])) {
    removed++;
    continue;
  }
  out.push(line);
}
fs.writeFileSync(nlPath, out.join("\n"));
console.log("removed", removed);