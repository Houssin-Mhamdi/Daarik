/**
 * Declarative filter registry for the public dishes endpoint.
 *
 * To add a new filter, append one entry to DISH_FILTERS. Each entry declares
 * the query-param key it reads and a function that mutates the Prisma `where`
 * clause. No other code needs to change.
 */
export type DishFilterQuery = Record<string, string | undefined>;

export type DishFilter = {
  /** Query-param key (e.g. "cuisine", "priceMin"). */
  key: string;
  /** Mutate `where` based on `query`. */
  apply: (query: DishFilterQuery, where: Record<string, any>) => void;
};

export const DISH_FILTERS: DishFilter[] = [
  {
    key: "cuisine",
    apply: (q, w) => {
      if (q.cuisine) w.cuisineId = q.cuisine;
    },
  },
  {
    key: "dietary",
    apply: (q, w) => {
      if (q.dietary) {
        const list = q.dietary.split(",").map((s) => s.trim()).filter(Boolean);
        if (list.length === 1) w.dietary = { has: list[0] };
        else if (list.length > 1) w.dietary = { hasEvery: list };
      }
    },
  },
  {
    key: "pickup",
    apply: (q, w) => {
      if (q.pickup) w.pickup = { has: q.pickup };
    },
  },
  {
    key: "featured",
    apply: (q, w) => {
      if (q.featured === "true") w.featured = true;
    },
  },
  {
    key: "weekend",
    apply: (q, w) => {
      if (q.weekend === "true") w.weekend = true;
    },
  },
  {
    key: "family",
    apply: (q, w) => {
      if (q.family === "true") w.family = true;
    },
  },
  {
    key: "availableOnly",
    apply: (q, w) => {
      if (q.availableOnly === "true") w.portionsLeft = { gt: 0 };
    },
  },
  {
    key: "sameDay",
    apply: (q, w) => {
      if (q.sameDay === "true") w.sameDayPickup = true;
    },
  },
  {
    key: "priceMin",
    apply: (q, w) => {
      if (q.priceMin) {
        w.price = { ...(w.price ?? {}), gte: Number(q.priceMin) };
      }
    },
  },
  {
    key: "priceMax",
    apply: (q, w) => {
      if (q.priceMax) {
        w.price = { ...(w.price ?? {}), lte: Number(q.priceMax) };
      }
    },
  },
  {
    key: "ratingMin",
    apply: (q, w) => {
      if (q.ratingMin) w.rating = { gte: Number(q.ratingMin) };
    },
  },
  {
    key: "cookId",
    apply: (q, w) => {
      if (q.cookId) {
        w.cook = { ...(w.cook ?? {}), OR: [{ id: q.cookId }, { slug: q.cookId }] };
      }
    },
  },
  {
    key: "city",
    apply: (q, w) => {
      if (q.city) {
        w.cook = { ...(w.cook ?? {}), city: { equals: q.city, mode: "insensitive" } };
      }
    },
  },
  {
    key: "q",
    apply: (q, w) => {
      if (q.q) {
        w.OR = [
          { searchText: { contains: q.q } },
          { cook: { name: { contains: q.q, mode: "insensitive" } } },
        ];
      }
    },
  },
];

/** Apply all registered filters to a where clause. */
export function applyDishFilters(
  query: DishFilterQuery,
  where: Record<string, any>,
): void {
  for (const filter of DISH_FILTERS) {
    filter.apply(query, where);
  }
}
