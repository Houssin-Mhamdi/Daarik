import fs from "node:fs";

const files = [
  "src/lib/i18n/en.ts",
  "src/lib/i18n/nl.ts",
  "src/lib/i18n/ar.ts",
  "src/lib/legal.ts",
  "src/app/layout.tsx",
  "src/components/shell/site-footer.tsx",
  "src/app/offline/page.tsx",
  "src/app/cook/page.tsx",
  "src/app/admin/payouts/page.tsx",
  "src/app/login/page.tsx",
  "src/app/register/page.tsx",
];

for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  c = c.replace(/(["'`][^"'`]*?)Darna/g, (m) => m.replaceAll("Darna", "Daarik"));
  c = c.replaceAll("دارنا", "دارك");
  c = c.replaceAll("@darna.food", "@daarik.food");
  c = c.replaceAll("hello@darna.nl", "hello@daarik.nl");
  c = c.replaceAll("finance@darna.nl", "finance@daarik.nl");
  c = c.replaceAll("Darna B.V.", "Daarik B.V.");
  fs.writeFileSync(f, c);
}
console.log("Rebranded display text to Daarik / دارك");
