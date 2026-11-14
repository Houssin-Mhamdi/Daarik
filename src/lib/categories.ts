import type { TranslationKey } from "@/lib/i18n";

const DEFAULT_CATEGORIES = [
  "Best selling",
  "Discount",
  "Drinks",
  "Mains",
  "Desserts",
  "Sides",
];

const KEY_MAP: Record<string, string> = {
  "Best selling": "catBestSelling",
  "Discount": "catDiscount",
  "Drinks": "catDrinks",
  "Mains": "catMains",
  "Desserts": "catDesserts",
  "Sides": "catSides",
};

export function translateCategory(cat: string, t: (key: any) => string): string {
  const key = KEY_MAP[cat];
  if (key) {
    try {
      return t(key as any);
    } catch {
      return cat;
    }
  }
  return cat; // custom category: show as-is
}

export { DEFAULT_CATEGORIES };
