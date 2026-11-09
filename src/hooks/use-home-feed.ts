"use client";

import { useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import type { SearchArea } from "@/components/app/location-picker";
import { cooksWithin } from "@/lib/cities";
import { cityMatches } from "@/lib/utils";

/** Everything the home page derives from the catalog for the chosen location. */
export function useHomeFeed(city: string, area: SearchArea | null) {
  const { dishes, cooks } = useApp();

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

  // One featured dish per cook, so the hero rotates through different kitchens.
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
