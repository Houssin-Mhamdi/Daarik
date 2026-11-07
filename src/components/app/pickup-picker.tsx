"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import type { Dish } from "@/lib/data";
import { cookPoint, coordsForCity, distanceKm, type GeoPoint } from "@/lib/cities";
import { slotsForOption } from "@/lib/pickup";
import { cityMatches, cn } from "@/lib/utils";

const LOCATION_STORAGE_KEY = "darna.delivery-location";

function readCustomerLocation(fallbackCity?: string): {
  point: GeoPoint | null;
  city: string;
} {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          lat?: number;
          lng?: number;
          city?: string;
        };
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          return {
            point: { lat: Number(parsed.lat), lng: Number(parsed.lng) },
            city: parsed.city || fallbackCity || "",
          };
        }
      }
    } catch {
      /* ignore */
    }
  }
  const city = fallbackCity || "";
  return { point: city ? coordsForCity(city) : null, city };
}

export function PickupPicker({
  available,
  dishes,
  compact,
  className,
  onChange,
}: {
  available?: string[];
  dishes?: Dish[];
  compact?: boolean;
  className?: string;
  onChange?: () => void;
}) {
  const {
    t,
    lang,
    cooks,
    user,
    pickup,
    setPickup,
    pickupTime,
    setPickupTime,
    pickupOptions,
  } = useApp();
  const [customerLoc, setCustomerLoc] = useState<{
    point: GeoPoint | null;
    city: string;
  }>({ point: null, city: "" });

  useEffect(() => {
    queueMicrotask(() => {
      setCustomerLoc(readCustomerLocation(user.city));
    });
  }, [user.city]);

  const isSameDayWithinRadius = (dish: Dish): boolean => {
    const schedule = dish.schedule;
    if (!schedule?.sameDay) return false;
    const cook = cooks.find((c) => c.id === dish.cookId);
    if (!cook) return true;
    const cookCoords = cookPoint(cook);
    if (customerLoc.point && cookCoords) {
      return (
        distanceKm(customerLoc.point, cookCoords) <= schedule.sameDayRadiusKm
      );
    }
    if (customerLoc.city && cook.city) {
      return cityMatches(customerLoc.city, cook.city);
    }
    return true;
  };

  const slotsFor = (option: (typeof pickupOptions)[number]) => {
    const isToday = option.id === pickupOptions[0]?.id;
    if (
      isToday &&
      dishes?.length &&
      dishes.some((dish) => dish.schedule && !isSameDayWithinRadius(dish))
    ) {
      return [];
    }
    const lists = (dishes ?? [])
      .filter((dish) => dish.schedule)
      .map((dish) => slotsForOption(dish.schedule, option, isToday));
    if (!lists.length) return slotsForOption(undefined, option, isToday);
    return lists.reduce((a, b) => a.filter((slot) => b.includes(slot)));
  };
  const options = (
    available
      ? pickupOptions.filter((option) => available.includes(option.id))
      : pickupOptions
  ).filter((option) => slotsFor(option).length > 0);
  const active = options.find((option) => option.id === pickup) ?? options[0];
  const activeSlots = active ? slotsFor(active) : [];

  useEffect(() => {
    if (!active) return;
    if (active.id !== pickup) setPickup(active.id);
    if (activeSlots.length && !activeSlots.includes(pickupTime)) {
      setPickupTime(activeSlots[0]);
    }
  });

  if (!active) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal">
            <CalendarDays className="size-3.5 text-terracotta" />
            {t("pickupDate")}
          </p>
          <span className="text-[12.5px] text-muted">{t("pickupOnly")}</span>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
          {options.map((option) => {
            const selected = option.id === active.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setPickup(option.id);
                  onChange?.();
                }}
                aria-pressed={selected}
                className={cn(
                  "flex min-w-[92px] flex-col items-center gap-0.5 rounded-2xl border px-3 py-2.5 transition",
                  compact && "min-w-[84px] py-2",
                  selected
                    ? "border-terracotta bg-terracotta text-white shadow-[0_8px_20px_-14px_rgba(198,93,58,0.9)]"
                    : "border-line bg-white text-charcoal hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "text-[11.5px] font-bold uppercase tracking-[0.1em]",
                    selected ? "text-white/75" : "text-muted-soft",
                  )}
                >
                  {option.shortDay[lang].split(" ")[0]}
                </span>
                <span className="text-[15px] font-semibold">
                  {option.shortDay[lang].split(" ").slice(1).join(" ")}
                </span>
                {option.id === pickupOptions[0]?.id ||
                option.id === pickupOptions[1]?.id ? (
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-terracotta-50 text-terracotta",
                    )}
                  >
                    {option.id === pickupOptions[0]?.id
                      ? t("today")
                      : t("tomorrow")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {dishes?.length === 1 &&
      dishes[0].schedule?.sameDay &&
      active.id === pickupOptions[0]?.id ? (
        <p className="text-[12.5px] text-muted">
          {t("sameDayWithin", { km: dishes[0].schedule.sameDayRadiusKm })}
        </p>
      ) : null}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[14px] font-semibold text-charcoal">
          <Clock className="size-3.5 text-terracotta" />
          {t("pickupTime")}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {activeSlots.map((slot) => {
            const selected = slot === pickupTime;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setPickupTime(slot);
                  onChange?.();
                }}
                aria-pressed={selected}
                className={cn(
                  "h-10 rounded-xl border text-[14.5px] font-semibold transition",
                  selected
                    ? "border-charcoal bg-charcoal text-cream"
                    : "border-line bg-white text-charcoal hover:border-line-strong",
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SelectedPickup({ compact }: { compact?: boolean }) {
  const { lang, pickup, pickupTime, pickupOptions } = useApp();
  const option = pickupOptions.find((p) => p.id === pickup);
  if (!option) return null;
  return (
    <span className={cn("text-[14px] text-muted", compact && "text-[13px]")}>
      {option.shortDay[lang]} · {pickupTime}
    </span>
  );
}
