"use client";

import { CalendarDays, Clock } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { pickupOptions } from "@/lib/data";
import { cn } from "@/lib/utils";

export function PickupPicker({
  available,
  compact,
  className,
  onChange,
}: {
  available?: string[];
  compact?: boolean;
  className?: string;
  onChange?: () => void;
}) {
  const { t, lang, pickup, setPickup, pickupTime, setPickupTime } = useApp();
  const options = available
    ? pickupOptions.filter((option) => available.includes(option.id))
    : pickupOptions;
  const active = options.find((option) => option.id === pickup) ?? options[0];

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
                {option.id === "sat-31" ? (
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-terracotta-50 text-terracotta",
                    )}
                  >
                    {t("weekendSpecial")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[14px] font-semibold text-charcoal">
          <Clock className="size-3.5 text-terracotta" />
          {t("pickupTime")}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {active.slots.map((slot) => {
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
  const { lang, pickup, pickupTime } = useApp();
  const option = pickupOptions.find((p) => p.id === pickup);
  if (!option) return null;
  return (
    <span className={cn("text-[14px] text-muted", compact && "text-[13px]")}>
      {option.shortDay[lang]} · {pickupTime}
    </span>
  );
}
