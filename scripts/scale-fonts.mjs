import fs from "node:fs";
import path from "node:path";

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (/\.(tsx|ts)$/.test(entry.name)) list.push(full);
  }
  return list;
}

const files = walk("src");
let updatedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const next = original.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (match, numStr) => {
    const val = parseFloat(numStr);
    // Bump small/body font sizes (8px..18px) by +2px, and headings (19px..36px) by +2px
    if (val >= 8 && val <= 36) {
      const bumped = Number((val + 2).toFixed(1));
      return `text-[${bumped}px]`;
    }
    return match;
  });
  if (next !== original) {
    fs.writeFileSync(file, next, "utf8");
    updatedFiles++;
  }
}

console.log(`Scaled font sizes (+2px) in ${updatedFiles} files`);
