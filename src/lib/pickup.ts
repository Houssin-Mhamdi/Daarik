import type { Dish, Localized, PickupOption } from "@/lib/data";

export const WEEKDAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;
export const WEEK_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const SAME_DAY_RADII = [5, 10, 15, 20, 25];
export const PICKUP_HORIZON_DAYS = 14;
const SAME_DAY_LEAD_MINUTES = 60;

export const DEFAULT_PICKUP_SLOTS = [
  "12:00",
  "12:30",
  "13:00",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

export const ALL_PICKUP_SLOTS = Array.from({ length: 27 }, (_, i) => {
  const total = 8 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${total % 60 === 0 ? "00" : "30"}`;
});

export type PickupSchedule = {
  windows: Record<string, string[]>;
  sameDay: boolean;
  sameDayRadiusKm: number;
  nextDay: boolean;
};

function dateId(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayOf(id: string) {
  const [y, m, d] = id.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(y, m - 1, d).getDay()];
}

export function buildPickupOptions(now = new Date()): PickupOption[] {
  const formats = (locale: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, opts);
  const longNl = formats("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const longEn = formats("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const longAr = formats("ar", { weekday: "long", day: "numeric", month: "long" });
  const shortNl = formats("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  const shortEn = formats("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const shortAr = formats("ar", { weekday: "short", day: "numeric", month: "short" });
  const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const pack = (n: Intl.DateTimeFormat, e: Intl.DateTimeFormat, a: Intl.DateTimeFormat, d: Date): Localized => ({
    nl: cap(n.format(d).replace(/\./g, "")),
    en: e.format(d).replace(/,/g, ""),
    ar: a.format(d),
  });

  return Array.from({ length: PICKUP_HORIZON_DAYS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const id = dateId(d);
    return {
      id,
      date: id,
      day: pack(longNl, longEn, longAr, d),
      shortDay: pack(shortNl, shortEn, shortAr, d),
      slots: DEFAULT_PICKUP_SLOTS,
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSchedule(raw: Record<string, unknown>): PickupSchedule {
  const windows: Record<string, string[]> = {};
  if (isRecord(raw.pickupWindows)) {
    for (const [day, slots] of Object.entries(raw.pickupWindows)) {
      if (Array.isArray(slots) && slots.length) {
        windows[day] = slots.filter((s): s is string => typeof s === "string");
      }
    }
  }
  const legacyDays = Array.isArray(raw.pickup)
    ? (raw.pickup as unknown[]).filter((d): d is string =>
        WEEKDAY_KEYS.includes(d as (typeof WEEKDAY_KEYS)[number]),
      )
    : [];
  for (const day of legacyDays) {
    if (!windows[day]) windows[day] = DEFAULT_PICKUP_SLOTS;
  }
  return {
    windows,
    sameDay: raw.sameDayPickup === true,
    sameDayRadiusKm:
      typeof raw.sameDayRadiusKm === "number" ? raw.sameDayRadiusKm : 5,
    nextDay: raw.nextDayPickup !== false,
  };
}

/** Date ids (next 14 days) on which a dish can be collected. */
export function expandPickupIds(
  schedule: PickupSchedule,
  options: PickupOption[],
) {
  return options
    .filter((option, index) => {
      if (index === 0) return schedule.sameDay && hasSlots(schedule, option);
      if (index === 1 && schedule.nextDay) return true;
      return Boolean(schedule.windows[weekdayOf(option.id)]);
    })
    .map((option) => option.id);
}

function hasSlots(schedule: PickupSchedule, option: PickupOption) {
  return slotsForOption(schedule, option, true).length > 0;
}

/** Slots on a day; today's slots must still be at least an hour away. */
export function slotsForOption(
  schedule: PickupSchedule | undefined,
  option: PickupOption,
  isToday: boolean,
  now = new Date(),
) {
  const base = schedule?.windows[weekdayOf(option.id)] ?? option.slots;
  if (!isToday) return base;
  const limit = now.getHours() * 60 + now.getMinutes() + SAME_DAY_LEAD_MINUTES;
  return base.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    return h * 60 + m >= limit;
  });
}
