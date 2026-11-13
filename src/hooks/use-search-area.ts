"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SearchArea } from "@/components/app/location-picker";
import { useApp } from "@/components/providers/app-provider";

const DEFAULT_RADIUS_KM = 10;

/**
 * The customer's chosen city and search circle, kept in the URL
 * (`?city=Amsterdam&lat=..&lng=..&r=10`) so it is visible, shareable and never
 * silently persisted. When the URL has no `city` param, a signed-in customer
 * falls back to the city on their profile; `?city=` (empty) means "all of the
 * Netherlands" and overrides that default.
 */
export function useSearchArea() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { isAuthenticated, user } = useApp();
  const pending = useRef<Array<(next: URLSearchParams) => void>>([]);

  const city = params.has("city")
    ? (params.get("city") ?? "")
    : isAuthenticated
      ? (user.city ?? "")
      : "";

  const lat = params.get("lat");
  const lng = params.get("lng");
  const radius = params.get("r");
  const area = useMemo<SearchArea | null>(() => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!lat || !lng || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return null;
    }
    const radiusNum = Number(radius);
    return {
      lat: latNum,
      lng: lngNum,
      radiusKm:
        radius && Number.isFinite(radiusNum) ? radiusNum : DEFAULT_RADIUS_KM,
    };
  }, [lat, lng, radius]);

  // Picker updates city and area back to back; batch them into one navigation.
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      pending.current.push(mutate);
      if (pending.current.length > 1) return;
      queueMicrotask(() => {
        const next = new URLSearchParams(window.location.search);
        for (const apply of pending.current) apply(next);
        pending.current = [];
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [router, pathname],
  );

  const setCity = useCallback<Dispatch<SetStateAction<string>>>(
    (value) => {
      const nextCity = typeof value === "function" ? value(city) : value;
      update((next) => next.set("city", nextCity));
    },
    [city, update],
  );

  const setArea = useCallback(
    (nextArea: SearchArea | null) => {
      update((next) => {
        if (nextArea) {
          next.set("lat", String(nextArea.lat));
          next.set("lng", String(nextArea.lng));
          next.set("r", String(nextArea.radiusKm));
        } else {
          next.delete("lat");
          next.delete("lng");
          next.delete("r");
        }
      });
    },
    [update],
  );

  return { city, area, ready: true, setCity, setArea };
}
