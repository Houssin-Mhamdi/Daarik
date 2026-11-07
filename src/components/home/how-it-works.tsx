"use client";

import { CalendarCheck, Search, UtensilsCrossed } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

export function HowItWorks() {
  const { t } = useApp();
  const steps = [
    { icon: Search, label: t("search") },
    { icon: CalendarCheck, label: t("preOrder") },
    { icon: UtensilsCrossed, label: t("pickup") },
  ];

  return (
    <div className="rounded-[24px] border border-line bg-white/70 p-4">
      <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-muted-soft">
        {t("howItWorksTitle")}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col items-center gap-1.5">
            <span className="grid size-9 place-items-center rounded-full bg-cream-100 text-terracotta">
              <step.icon className="size-4" />
            </span>
            <span className="text-[12.5px] font-semibold text-charcoal">
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[12px] text-muted">
        {t("pickupOnly")} · {t("madeIn")}
      </p>
    </div>
  );
}
