type Localized = Partial<Record<"nl" | "en" | "ar", string>> | null | undefined;

/**
 * Lowercased text a customer can search a dish by. Stored in `Dish.searchText`
 * (trigram-indexed) so search runs in the database, not in memory.
 */
export function buildDishSearchText(dish: {
  name?: unknown;
  desc?: unknown;
  cuisineId?: string | null;
}): string {
  const name = (dish.name ?? {}) as Localized;
  const desc = (dish.desc ?? {}) as Localized;
  return [
    name?.nl,
    name?.en,
    name?.ar,
    desc?.nl,
    desc?.en,
    desc?.ar,
    dish.cuisineId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
