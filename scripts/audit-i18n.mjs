import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/dell2/darna/src";
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}
walk(root);

const used = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/\bt\(\s*["'`]([^"'`$]+)["'`]/g)) {
    used.add(match[1]);
  }
}

const en = fs.readFileSync(path.join(root, "lib/i18n/en.ts"), "utf8");
const defined = new Set([...en.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)].map((m) => m[1]));

const missing = [...used].filter((key) => !defined.has(key)).sort();
console.log("USED", used.size, "DEFINED", defined.size);
console.log("MISSING\n" + missing.join("\n"));

// duplicate keys in en
const all = [...en.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)].map((m) => m[1]);
const dupes = all.filter((key, i) => all.indexOf(key) !== i);
console.log("\nDUPLICATES\n" + [...new Set(dupes)].join("\n"));
