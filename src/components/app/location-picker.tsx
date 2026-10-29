"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
} from "lucide-react";
import { CookCard } from "@/components/app/cook-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import { cityMatches } from "@/lib/utils";
import type { MapPoint } from "./location-map";

type DeliveryLocation = MapPoint & {
  city: string;
  label: string;
};

type PlaceResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

const LOCATION_STORAGE_KEY = "darna.delivery-location";
const LOCATION_REQUESTED_KEY = "darna.location-requested";

function cityFromAddress(address?: Record<string, string>) {
  return (
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    address?.suburb ||
    address?.county ||
    ""
  );
}

async function reverseGeocode(point: MapPoint) {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    zoom: "12",
    lat: String(point.lat),
    lon: String(point.lng),
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const result = (await response.json()) as PlaceResult;
  return {
    city: cityFromAddress(result.address),
    label: result.display_name?.split(",").slice(0, 3).join(",") ?? "",
  };
}

function pointFromResult(
  result: PlaceResult,
  fallbackCity: string,
): DeliveryLocation {
  const point = { lat: Number(result.lat), lng: Number(result.lon) };
  return {
    ...point,
    city: cityFromAddress(result.address) || fallbackCity,
    label: result.display_name,
  };
}

export function LocationPicker({
  open,
  onClose,
  currentCity,
  onCityChange,
}: {
  open: boolean;
  onClose: () => void;
  currentCity: string;
  onCityChange: Dispatch<SetStateAction<string>>;
}) {
  const { t, cooks } = useApp();
  const [mode, setMode] = useState<"options" | "map">("options");
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const nearbyCooks = useMemo(
    () =>
      location?.city
        ? cooks.filter((cook) => cityMatches(cook.city, location.city))
        : [],
    [cooks, location],
  );

  useEffect(() => {
    let active = true;

    try {
      const saved = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DeliveryLocation;
        if (
          parsed.city &&
          parsed.label &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng)
        ) {
          const restoreTimer = window.setTimeout(() => {
            if (!active) return;
            setLocation(parsed);
            setMapPoint(parsed);
            onCityChange(parsed.city);
          }, 0);
          return () => {
            active = false;
            window.clearTimeout(restoreTimer);
          };
        }
      }
    } catch {
      window.localStorage.removeItem(LOCATION_STORAGE_KEY);
    }

    if (
      window.localStorage.getItem(LOCATION_REQUESTED_KEY) === "true" ||
      !navigator.geolocation
    ) {
      return () => {
        active = false;
      };
    }

    window.localStorage.setItem(LOCATION_REQUESTED_KEY, "true");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        let place: Awaited<ReturnType<typeof reverseGeocode>> = null;
        try {
          place = await reverseGeocode(point);
        } catch {
          place = null;
        }
        if (!active) return;
        const nextLocation: DeliveryLocation = {
          ...point,
          city: place?.city || t("currentLocation"),
          label: place?.label || t("currentLocation"),
        };
        setLocation(nextLocation);
        setMapPoint(point);
        onCityChange(nextLocation.city);
        window.localStorage.setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify(nextLocation),
        );
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );

    return () => {
      active = false;
    };
  }, [onCityChange, t]);

  const closePicker = () => {
    setMode("options");
    setError("");
    onClose();
  };

  const commitLocation = (nextLocation: DeliveryLocation) => {
    setLocation(nextLocation);
    setMapPoint(nextLocation);
    onCityChange(nextLocation.city || nextLocation.label.split(",")[0]);
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(nextLocation),
    );
    closePicker();
  };

  const useCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError(t("locationUnavailable"));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        let place: Awaited<ReturnType<typeof reverseGeocode>> = null;
        try {
          place = await reverseGeocode(point);
        } catch {
          place = null;
        }
        setIsLocating(false);
        commitLocation({
          ...point,
          city: place?.city || t("currentLocation"),
          label: place?.label || t("currentLocation"),
        });
      },
      () => {
        setIsLocating(false);
        setError(t("locationError"));
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  };

  const searchPlaces = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError("");
    setResults([]);
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        q: query.trim(),
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Location search failed");
      const matches = (await response.json()) as PlaceResult[];
      setResults(matches);
      if (matches.length === 0) setError(t("locationSearchFailed"));
    } catch {
      setError(t("locationSearchFailed"));
    } finally {
      setIsSearching(false);
    }
  };

  const selectMapPoint = async (point: MapPoint) => {
    setMapPoint(point);
    setError("");
    try {
      const place = await reverseGeocode(point);
      setLocation({
        ...point,
        city: place?.city || t("currentLocation"),
        label:
          place?.label || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
      });
    } catch {
      setLocation({
        ...point,
        city: t("currentLocation"),
        label: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
      });
    }
  };

  return (
    <Sheet
      open={open}
      onClose={closePicker}
      title={mode === "map" ? t("searchOnMap") : t("deliveryLocation")}
      description={
        mode === "map" ? t("mapInstructions") : t("deliveryLocationDescription")
      }
      className="md:max-w-2xl"
    >
      {mode === "options" ? (
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={isLocating}
            className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-start transition hover:border-terracotta/50 hover:bg-terracotta-50/40 disabled:opacity-70"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-terracotta-50 text-terracotta">
              {isLocating ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <LocateFixed className="size-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-charcoal">
                {isLocating ? t("locating") : t("deliverToCurrentLocation")}
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-muted">
                {location?.label || currentCity}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("map")}
            className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-start transition hover:border-terracotta/50 hover:bg-terracotta-50/40"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-olive-50 text-olive">
              <MapPin className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-charcoal">
                {t("deliverToAnotherLocation")}
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {t("searchOnMap")}
              </span>
            </span>
            <Search className="size-4 shrink-0 text-muted" />
          </button>

          {error ? (
            <p
              className="rounded-xl bg-[#fff0eb] px-3 py-2.5 text-sm text-[#9b3d2c]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => setMode("options")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-charcoal hover:bg-white"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("back")}
          </button>

          <form onSubmit={searchPlaces} className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("locationSearchPlaceholder")}
              aria-label={t("locationSearchPlaceholder")}
              className="h-11 min-w-0 rounded-xl text-sm"
            />
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-11 shrink-0 gap-1.5 px-3"
            >
              {isSearching ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              <span className="hidden sm:inline">{t("searchLocation")}</span>
            </Button>
          </form>

          {results.length > 0 ? (
            <div
              className="max-h-40 overflow-y-auto rounded-xl border border-line bg-white"
              aria-label={t("locationSearchResults")}
            >
              {results.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}`}
                  type="button"
                  onClick={() => {
                    const nextLocation = pointFromResult(
                      result,
                      t("currentLocation"),
                    );
                    setLocation(nextLocation);
                    setMapPoint(nextLocation);
                    setResults([]);
                  }}
                  className="flex w-full items-start gap-2 border-b border-line px-3 py-2.5 text-start last:border-b-0 hover:bg-cream-100"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-terracotta" />
                  <span className="text-[13px] leading-snug text-charcoal">
                    {result.display_name}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="h-65 overflow-hidden rounded-2xl border border-line bg-cream-100 md:h-80">
            <LocationMap point={mapPoint} onSelect={selectMapPoint} />
          </div>

          {error ? (
            <p className="text-sm text-[#9b3d2c]" role="alert">
              {error}
            </p>
          ) : null}

          {location ? (
            <div className="rounded-xl border border-line bg-white px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                {t("selectedLocation")}
              </p>
              <p className="mt-1 text-sm font-semibold text-charcoal">
                {location.label}
              </p>
            </div>
          ) : null}

          {location ? (
            <div className="border-t border-line pt-3">
              <p className="text-sm font-semibold text-charcoal">
                {t("cooksNearLocation", {
                  city: location.city || currentCity,
                })}
              </p>
              {nearbyCooks.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {nearbyCooks.map((cook) => (
                    <CookCard key={cook.id} cook={cook} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t("noCooksAtLocation")}
                </p>
              )}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => location && commitLocation(location)}
            disabled={!location}
            className="w-full"
          >
            {t("useThisLocation")}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
