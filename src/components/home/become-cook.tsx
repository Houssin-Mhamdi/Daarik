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
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-cream px-4 text-[14px] font-semibold text-olive-600"
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
    <div className="relative mt-10 overflow-hidden rounded-[32px] bg-olive px-10 py-9 text-cream">
      <div className="absolute -end-16 -top-24 size-72 rounded-full border-[34px] border-white/10" />
      <div className="absolute -bottom-20 end-40 size-48 rounded-full border-[24px] border-white/5" />
      <div className="relative flex items-center justify-between gap-8">
        <div>
          <span className="flex size-11 items-center justify-center rounded-full bg-white/12">
            <ChefHat className="size-5" />
          </span>
          <h3 className="mt-4 max-w-[480px] font-display text-[36px] leading-tight">
            {t("becomeCookTitle")}
          </h3>
          <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-cream/75">
            {t("becomeCookSub")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/cook"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-cream px-5 text-[15px] font-semibold text-olive-600"
            >
              {t("becomeCookCta")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/help"
              className="text-[14px] font-semibold text-cream/75 underline-offset-4 hover:text-cream hover:underline"
            >
              {t("learnMore")}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[12px] uppercase tracking-[0.14em] text-cream/60">
              {t("exampleNet")}
            </p>
            <p className="mt-1 font-display text-[28px]">€476</p>
            <p className="text-[12px] text-cream/60">{t("exampleEarningsNote")}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {cooks.slice(0, 3).map((cook) => (
                <Image
                  key={cook.id}
                  src={cook.avatar || "/img/daarik-logo.png"}
                  alt={cook.name}
                  width={36}
                  height={36}
                  loading="lazy"
                  unoptimized
                  className="size-9 rounded-full border-2 border-olive object-cover"
                />
              ))}
            </div>
            <span className="text-[12px] text-cream/60">{t("cooksNearYou")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
