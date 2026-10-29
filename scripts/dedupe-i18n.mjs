import fs from "node:fs";

const keys = [
  "pickupTime", "messageCook", "reviewOrder", "reviewSub", "ordersCount",
  "viewOrder", "customer", "orderFrom", "cookingDays", "faqTitle",
  "contactSupport", "responseTime", "editDetails", "topCooks", "topCooksSub",
  "people", "saveAdminSettings",
];

for (const name of ["en", "nl", "ar"]) {
  const file = `C:/Users/dell2/darna/src/lib/i18n/${name}.ts`;
  let lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const key of keys) {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => new RegExp(`^\\s{2}${key}:`).test(line));
    for (const { index } of matches.slice(1).reverse()) {
      lines.splice(index, 1);
    }
  }
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`deduped ${name}`);
}
