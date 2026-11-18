"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChefHat } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import type { Cook } from "@/lib/data";

/** Compact "become a cook" card for mobile. */
export function BecomeCookCard() {
  const { t } = useApp();
  return (
    <div className="relative overflow-hidden rounded-[26px] bg-olive px-5 py-5 text-cream shadow-card">
      <div className="absolute -end-8 -top-10 size-32 rounded-full border-[18px] border-white/10" />
      <div className="relative">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
          <ChefHat className="size-[18px]" />
        </span>
        <h3 className="mt-3 max-w-[230px] font-display text-[25px] leading-tight">
          {t("becomeCookTitle")}
        </h3>
        <p className="mt-1.5 max-w-[250px] text-[13.5px] leading-relaxed text-cream/80">
          {t("becomeCookSub")}
        </p>
        <Link
          href="/cook"
          className="mt-4 inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-cream px-4 text-[14px] font-semibold text-olive-600"
        >
          {t("becomeCookCta")}
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

/** Wide "become a cook" banner for desktop. */
export function BecomeCookBanner({ cooks }: { cooks: Cook[] }) {
  const { t } = useApp();
  return (
    <div className="mt-10 rounded-[24px] border border-line bg-white px-8 py-8 shadow-card">
      <div className="flex items-center justify-between gap-8">
        <div className="max-w-[520px]">
          <span className="flex size-11 items-center justify-center rounded-full bg-olive-50 text-olive">
            <ChefHat className="size-5" />
          </span>
          <h3 className="mt-4 font-display text-[30px] leading-tight text-charcoal">
            {t("becomeCookTitle")}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {t("becomeCookSub")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/cook"
              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-olive px-5 text-[15px] font-semibold text-cream transition hover:bg-olive-600"
            >
              {t("becomeCookCta")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/help"
              className="text-[14px] font-semibold text-olive underline-offset-4 hover:underline"
            >
              {t("learnMore")}
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <div className="rounded-2xl border border-line bg-cream-50 px-5 py-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
              {t("cooksNearYou")}
            </p>
            <div className="mt-2 flex -space-x-2 rtl:space-x-reverse">
              {cooks.slice(0, 4).map((cook) => (
                <Image
                  key={cook.id}
                  src={cook.avatar || "/img/daarik-logo.png"}
                  alt={cook.name}
                  width={32}
                  height={32}
                  loading="lazy"
                  unoptimized
                  className="size-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
