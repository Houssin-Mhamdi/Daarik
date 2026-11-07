"use client";

import { useEffect, useState } from "react";
import type { SearchArea } from "@/components/app/location-picker";

const STORAGE_KEY = "darna.delivery-location";
const DEFAULT_RADIUS_KM = 10;
const FALLBACK_CITY = "Rotterdam";

type StoredLocation = {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

/**
 * The customer's chosen city and search circle, restored from localStorage.
 * `ready` stays false until the saved value was read, so callers can show a
 * skeleton instead of flashing a default city.
 */
export function useSearchArea() {
  const [city, setCity] = useState("");
  const [area, setArea] = useState<SearchArea | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let saved = "";
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredLocation) : null;
        saved = parsed?.city || "";
        if (
          parsed &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng)
        ) {
          setArea({
            lat: parsed.lat as number,
            lng: parsed.lng as number,
            radiusKm: parsed.radiusKm ?? DEFAULT_RADIUS_KM,
          });
        }
      } catch {
        saved = "";
      }
      setCity((current) => current || saved || FALLBACK_CITY);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { city, area, ready, setCity, setArea };
}
