"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  Check,
  Clock3,
  Info,
  Minus,
  Plus,
  Power,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/controls";
import { Card } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

const weekKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const allSlots = [
  "12:00",
  "12:30",
  "13:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

type Day = { iso: string; label: string; dayName: string; month: string; weekend: boolean };

export default function CookAvailabilityPage() {
  const { t, lang, toast } = useApp();
  const [days, setDays] = useState<string[]>(["fri", "sat", "sun"]);
  const [slots, setSlots] = useState<string[]>(["12:00", "17:30", "18:00", "18:30"]);
  const [capacity, setCapacity] = useState(12);
  const [vacation, setVacation] = useState(false);
  const [blocked, setBlocked] = useState<string[]>(["2026-11-06", "2026-11-14"]);
  const [saved, setSaved] = useState(false);

  const weekDays = useMemo(
    () => (lang === "nl" ? ["ma", "di", "wo", "do", "vr", "za", "zo"] : lang === "ar" ? ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
    [lang],
  );

  const dates: Day[] = useMemo(() => {
    const start = new Date("2026-10-29T12:00:00");
    return Array.from({ length: 21 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return {
        iso,
        label: String(date.getDate()),
        dayName: weekDays[(date.getDay() + 6) % 7],
        month: date.toLocaleDateString(lang === "ar" ? "ar" : lang === "nl" ? "nl-NL" : "en-GB", { month: "short" }),
        weekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [lang, weekDays]);

  function toggle(list: string[], setList: (value: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function save() {
    setSaved(true);
    toast(t("availabilitySaved"));
  }

  return (
    <div className="pb-28 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1100px] md:px-8 md:pt-10">
        <CookMobileHeader title={t("availabilityTitle")} subtitle={t("availabilitySub")} />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("availabilityTitle")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">{t("availabilitySub")}</p>
          </div>
          <Button onClick={save} size="sm">
            <Check className="size-3.5" />
            {t("saveAvailability")}
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:mt-5 md:grid-cols-[1fr_340px] md:items-start md:gap-5">
          <div className="space-y-3">
            {/* vacation */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-[22px] border p-4 transition",
                vacation
                  ? "border-saffron/40 bg-saffron-50/60"
                  : "border-line bg-white shadow-card",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-2xl",
                  vacation ? "bg-saffron/20 text-[#8a5d13]" : "bg-cream-100 text-charcoal",
                )}
              >
                <Power className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-charcoal">
                  {t("vacationMode")}
                  {vacation ? (
                    <Badge variant="saffron" size="sm">
                      {t("on")}
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                  {vacation ? t("vacationOn") : t("vacationOff")}
                </p>
              </div>
              <Switch
                checked={vacation}
                onCheckedChange={(value) => {
                  setVacation(value);
                  toast(value ? t("vacationOn") : t("vacationOff"), {
                    variant: value ? "info" : "success",
                  });
                }}
                label={t("vacationMode")}
              />
            </div>

            {/* Cooking days */}
            <Card className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-terracotta-50 text-terracotta">
                  <CalendarDays className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("cookingDays")}
                  </h2>
                  <p className="text-[12.5px] text-muted">{t("cookingDaysSub")}</p>
                </div>
                <Badge variant="outline" size="sm">
                  {t("cookingDaysCount", { count: days.length })}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {weekKeys.map((key, index) => {
                  const active = days.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(days, setDays, key)}
                      className={cn(
                        "flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border text-[12.5px] font-semibold transition",
                        active
                          ? "border-terracotta bg-terracotta text-white"
                          : "border-line bg-white text-muted",
                      )}
                    >
                      {weekDays[index]}
                      {active ? (
                        <Check className="size-2.5" strokeWidth={3} />
                      ) : (
                        <span className="size-2.5 rounded-full border border-current opacity-30" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Slots */}
            <Card className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-olive-50 text-olive-600">
                  <Clock3 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("pickupSlots")}
                  </h2>
                  <p className="text-[12.5px] text-muted">{t("pickupSlotsSub")}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {allSlots.map((slot) => {
                  const active = slots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggle(slots, setSlots, slot)}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-xl border text-[13px] font-semibold transition",
                        active
                          ? "border-olive bg-olive-50 text-olive-600"
                          : "border-line bg-white text-muted",
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-line-strong p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = `${String(9 + (slots.length % 9)).padStart(2, "0")}:00`;
                    if (!slots.includes(next)) setSlots([...slots, next].sort());
                  }}
                  className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-terracotta shadow-sm"
                >
                  <Plus className="size-3" />
                  {t("addSlot")}
                </button>
                <p className="text-[11.5px] leading-relaxed text-muted">{t("slotsHint")}</p>
              </div>
            </Card>

            {/* Capacity */}
            <Card className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-charcoal">
                  <Users className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("dailyCapacity")}
                  </h2>
                  <p className="text-[12.5px] text-muted">{t("dailyCapacitySub")}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-cream/50 p-3">
                <button
                  type="button"
                  onClick={() => setCapacity(Math.max(1, capacity - 1))}
                  className="grid size-10 place-items-center rounded-full border border-line bg-white text-charcoal"
                  aria-label={t("remove")}
                >
                  <Minus className="size-4" />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-[26px] font-semibold leading-none text-charcoal">
                    {capacity}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {t("portionsPerDay")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCapacity(capacity + 1)}
                  className="grid size-10 place-items-center rounded-full bg-terracotta text-white"
                  aria-label={t("addAnother")}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </Card>

            {/* Dates mobile */}
            <Card className="p-4 md:hidden">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-charcoal">
                  <Ban className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("blockedDates")}
                  </h2>
                  <p className="text-[12.5px] text-muted">{t("blockedDatesSub")}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {dates.map((date) => {
                  const isBlocked = blocked.includes(date.iso);
                  return (
                    <button
                      key={date.iso}
                      type="button"
                      onClick={() => {
                        toggle(blocked, setBlocked, date.iso);
                        toast(
                          isBlocked ? t("dateUnblocked") : t("dateBlocked"),
                          { variant: "info" },
                        );
                      }}
                      className={cn(
                        "flex flex-col items-center rounded-lg border py-1.5",
                        isBlocked
                          ? "border-[#e8c9c1] bg-[#fdf1ec] text-[#a13a28]"
                          : "border-line bg-white text-charcoal",
                      )}
                    >
                      <span className="text-[10px] text-muted">{date.dayName}</span>
                      <span className="text-[13px] font-semibold">{date.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 size-1 rounded-full",
                          isBlocked ? "bg-[#a13a28]" : "bg-olive",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] text-muted">{t("blockDatesHint")}</p>
            </Card>
          </div>

          {/* Aside */}
          <aside className="hidden space-y-3 md:sticky md:top-24 md:block">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-charcoal">
                  {t("blockedDates")}
                </h2>
                <Badge variant="outline" size="sm">
                  {blocked.length} {t("blocked")}
                </Badge>
              </div>
              <p className="mt-0.5 text-[12px] text-muted">{t("blockDatesHint")}</p>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {dates.map((date) => {
                  const isBlocked = blocked.includes(date.iso);
                  return (
                    <button
                      key={date.iso}
                      type="button"
                      onClick={() => {
                        toggle(blocked, setBlocked, date.iso);
                        toast(
                          isBlocked ? t("dateUnblocked") : t("dateBlocked"),
                          { variant: "info" },
                        );
                      }}
                      className={cn(
                        "flex flex-col items-center rounded-lg border py-1.5 text-[12px] transition",
                        isBlocked
                          ? "border-[#e8c9c1] bg-[#fdf1ec] text-[#a13a28]"
                          : "border-line bg-white text-charcoal hover:bg-cream",
                        date.weekend && !isBlocked && "bg-terracotta-50/30",
                      )}
                    >
                      <span className="text-[10px] text-muted">{date.dayName}</span>
                      <span className="font-semibold">{date.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] text-muted">{t("next30Days")}</p>
            </Card>

            <div className="rounded-2xl bg-cream-100 p-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                {t("vacationNote")}
              </p>
            </div>

            <Button className="w-full" onClick={save}>
              <Check className="size-4" />
              {saved ? t("availabilitySaved") : t("saveAvailability")}
            </Button>
            <p className="text-center text-[11.5px] text-muted-soft">
              {t("saveScheduleNote")}
            </p>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-cream/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] uppercase tracking-[0.1em] text-muted">
              {t("cookingDaysCount", { count: days.length })} ·{" "}
              {t("portionsPerDayShort", { count: capacity })}
            </p>
            <p className="text-[13.5px] font-semibold text-charcoal">
              {slots.length} {t("timeSlotsShort")}
            </p>
          </div>
          <Button className="h-12 px-5" onClick={save}>
            <Check className="size-4" />
            {t("saveAvailability")}
          </Button>
        </div>
      </div>
    </div>
  );
}
