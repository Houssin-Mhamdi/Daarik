/**
 * Declarative filter registry for the public cooks endpoint.
 *
 * To add a new filter, append one entry to COOK_FILTERS.
 */
export type CookFilterQuery = Record<string, string | undefined>;

export type CookFilter = {
  key: string;
  apply: (query: CookFilterQuery, where: Record<string, any>) => void;
};

export const COOK_FILTERS: CookFilter[] = [
  {
    key: "city",
    apply: (q, w) => {
      if (q.city) w.city = { equals: q.city, mode: "insensitive" };
    },
  },
  {
    key: "cuisine",
    apply: (q, w) => {
      if (q.cuisine) w.cuisineIds = { has: q.cuisine };
    },
  },
  {
    key: "q",
    apply: (q, w) => {
      if (q.q) w.name = { contains: q.q, mode: "insensitive" };
    },
  },
];

export function applyCookFilters(
  query: CookFilterQuery,
  where: Record<string, any>,
): void {
  for (const filter of COOK_FILTERS) {
    filter.apply(query, where);
  }
}
