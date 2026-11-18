"use client";

import { useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { useCooksPaginatedQuery, useDishesPaginatedQuery } from "@/lib/queries";
import type { SearchArea } from "@/components/app/location-picker";
import { cooksWithin } from "@/lib/cities";
import { cityMatches } from "@/lib/utils";

/**
 * Home feed. Uses server-side paginated queries for the catalog (so we never
 * load the whole table), then derives location-aware slices on the client.
 */
export function useHomeFeed(city: string, area: SearchArea | null) {
  const { cooks: contextCooks, dishes: contextDishes } = useApp();

  // Server-side: fetch a small page of cooks/dishes for the chosen city.
  const cooksQuery = useCooksPaginatedQuery(
    city ? { city, limit: "50" } : { limit: "50" },
  );
  const dishesQuery = useDishesPaginatedQuery(
    city ? { city, limit: "50" } : { limit: "50" },
  );

  const cooks = cooksQuery.data?.items ?? contextCooks;
  const dishes = dishesQuery.data?.items ?? contextDishes;

  const nearbyCooks = useMemo(
    () =>
      area
        ? cooksWithin(cooks, area, area.radiusKm)
        : city
          ? cooks.filter((cook) => cityMatches(cook.city, city))
          : cooks,
    [cooks, city, area],
  );

  const nearbyDishes = useMemo(() => {
    const ids = new Set(nearbyCooks.map((cook) => cook.id));
    return dishes.filter((dish) => ids.has(dish.cookId));
  }, [dishes, nearbyCooks]);

  const family = useMemo(
    () => nearbyDishes.filter((dish) => dish.family).slice(0, 6),
    [nearbyDishes],
  );

  const weekendPicks = useMemo(
    () => nearbyDishes.filter((dish) => dish.weekend || dish.featured).slice(0, 4),
    [nearbyDishes],
  );

  const heroList = useMemo(() => {
    const seen = new Set<string>();
    const picks = [...nearbyDishes, ...dishes].filter((dish) => {
      if (!(dish.featured || dish.weekend) || seen.has(dish.cookId)) return false;
      seen.add(dish.cookId);
      return true;
    });
    return picks.length ? picks : nearbyDishes.slice(0, 1);
  }, [nearbyDishes, dishes]);

  const offers = useMemo(() => heroList.slice(0, 8), [heroList]);

  return { nearbyCooks, nearbyDishes, family, weekendPicks, heroList, offers };
}
