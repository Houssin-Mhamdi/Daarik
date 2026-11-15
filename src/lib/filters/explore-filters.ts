export type Sort = "recommended" | "priceLow" | "priceHigh" | "rating" | "newest" | "nearest";

export type ExploreFilterState = {
  query: string;
  city: string;
  cuisine: string;
  price: "low" | "mid" | "high" | null;
  priceMin: number;
  priceMax: number;
  availability: "today" | "weekend" | null;
  diet: string[];
  ratingMin: number;
  nearMe: boolean;
  userCoords: { lat: number; lng: number } | null;
  sort: Sort;
  page: number;
};

/**
 * Declarative frontend filter registry for the explore page.
 *
 * To add a new filter:
 *   1. Add a state field to ExploreFilterState.
 *   2. Add one entry here with `key` (query param) and `value` (state -> string).
 *   3. Add the UI control in explore/page.tsx.
 * No other plumbing changes are needed.
 */
export const EXPLORE_FILTERS: { key: string; value: (s: ExploreFilterState) => string | undefined }[] = [
  { key: "q", value: (s) => s.query.trim() || undefined },
  { key: "city", value: (s) => s.city || undefined },
  { key: "cuisine", value: (s) => (s.cuisine !== "all" ? s.cuisine : undefined) },
  { key: "dietary", value: (s) => (s.diet.length ? s.diet.join(",") : undefined) },
  { key: "weekend", value: (s) => (s.availability === "weekend" ? "true" : undefined) },
  { key: "sameDay", value: (s) => (s.availability === "today" ? "true" : undefined) },
  { key: "priceMin", value: (s) => (s.priceMin > 0 ? String(s.priceMin) : s.price === "mid" ? "10" : s.price === "high" ? "15.01" : undefined) },
  { key: "priceMax", value: (s) => (s.priceMax < 25 ? String(s.priceMax) : s.price === "low" ? "9.99" : s.price === "mid" ? "15" : undefined) },
  { key: "ratingMin", value: (s) => (s.ratingMin > 0 ? String(s.ratingMin) : undefined) },
  { key: "sort", value: (s) =>
      s.sort === "priceLow"
        ? "priceLow"
        : s.sort === "priceHigh"
          ? "priceHigh"
          : s.sort === "rating"
            ? "rating"
            : s.sort === "newest"
              ? "newest"
              : s.sort === "nearest"
                ? "nearest"
                : undefined },
];

export function buildExploreParams(state: ExploreFilterState): Record<string, string> {
  const p: Record<string, string> = { page: String(state.page) };
  for (const f of EXPLORE_FILTERS) {
    const v = f.value(state);
    if (v) p[f.key] = v;
  }
  return p;
}
