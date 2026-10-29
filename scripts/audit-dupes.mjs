import fs from "node:fs";
for (const name of ["en", "nl", "ar"]) {
  const text = fs.readFileSync(`C:/Users/dell2/darna/src/lib/i18n/${name}.ts`, "utf8");
  const keys = [...text.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)].map((m) => m[1]);
  const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  console.log(name, keys.length, "duplicates:", dupes.join(", "));
}
