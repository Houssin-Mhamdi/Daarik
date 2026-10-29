"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { dishes, getCook, loc } from "@/lib/data";

export default function OfflinePage() {
  const { t, lang, favorites } = useApp();
  const saved = dishes.filter((dish) => favorites.includes(dish.id)).slice(0, 3);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-[max(28px,env(safe-area-inset-top))] md:max-w-[520px] md:justify-center md:py-14">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center overflow-hidden rounded-[12px] bg-terracotta">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/daarik-logo.png"
              alt="Daarik"
              className="size-full object-cover"
            />
          </span>
          <div className="leading-none">
            <p className="font-display text-[21px] font-semibold tracking-[-0.03em] text-charcoal">
              Daarik
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta">
              {t("customerApp")}
            </p>
          </div>
        </div>

        <div className="mt-14 text-center md:mt-10">
          <div className="relative mx-auto grid size-24 place-items-center">
            <span className="absolute inset-0 rounded-full bg-terracotta-50" />
            <span className="absolute inset-3 rounded-full border border-dashed border-terracotta/30" />
            <WifiOff className="relative size-8 text-terracotta" />
          </div>
          <h1 className="mt-5 font-display text-[30px] font-semibold leading-tight text-charcoal md:text-[34px]">
            {t("offlineTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[14.5px] leading-relaxed text-muted">
            {t("offlineSub")}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              {t("retry")}
            </Button>
            <Link
              href="/favorites"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[14px] font-semibold text-charcoal"
            >
              <Bookmark className="size-3.5" />
              {t("savedDishes")}
            </Link>
          </div>
        </div>

        {saved.length ? (
          <div className="mt-9">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                {t("offlineSaved")}
              </p>
              <span className="rounded-full bg-olive-50 px-2 py-0.5 text-[11px] font-bold text-olive">
                {saved.length} {t("saved")}
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              {saved.map((dish) => {
                const cook = getCook(dish.cookId);
                return (
                  <div
                    key={dish.id}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 shadow-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.image}
                      alt={loc(dish.name, lang)}
                      className="size-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-charcoal">
                        {loc(dish.name, lang)}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {cook?.name} · {cook?.city}
                      </p>
                    </div>
                    <span className="rounded-full bg-cream-100 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                      {t("offline")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-4 text-[12px] text-muted-soft">
          <span>{t("pwaWorksEverywhere")}</span>
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-charcoal">
            {t("home")}
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
