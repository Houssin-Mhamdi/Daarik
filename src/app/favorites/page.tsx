"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Star, UtensilsCrossed } from "lucide-react";
import { SegmentedTabs } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { DishCard } from "@/components/app/dish-card";
import { useApp } from "@/components/providers/app-provider";
import { cooks, dishes, getCook, loc } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { t, lang, favorites, favoriteCooks, toggleFavoriteCook, toast } =
    useApp();
  const [tab, setTab] = useState<"dishes" | "cooks">("dishes");

  const savedDishes = dishes.filter((dish) => favorites.includes(dish.id));
  const savedCooks = cooks.filter((cook) => favoriteCooks.includes(cook.id));

  return (
    <div className="pb-8">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1240px] md:px-8 md:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("saved")}
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-tight text-charcoal md:text-[38px]">
              {t("favoritesTitle")}
            </h1>
            <p className="mt-1 text-[14px] text-muted md:text-sm">
              {t("favoritesSub")}
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-charcoal md:flex">
            <Heart className="size-3.5 fill-terracotta text-terracotta" />
            {savedDishes.length + savedCooks.length} {t("saved").toLowerCase()}
          </div>
        </div>

        <div className="mt-5 md:max-w-md">
          <SegmentedTabs
            tabs={[
              { value: "dishes", label: t("savedDishes"), count: savedDishes.length },
              { value: "cooks", label: t("savedCooks"), count: savedCooks.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "dishes" ? (
          savedDishes.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {savedDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              icon={<Heart className="size-7" />}
              title={t("emptyFavTitle")}
              description={t("emptyFavSub")}
              action={
                <Link href="/explore">
                  <Button>{t("exploreFood")}</Button>
                </Link>
              }
            />
          )
        ) : savedCooks.length > 0 ? (
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {savedCooks.map((cook) => (
              <div
                key={cook.id}
                className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-3 shadow-card"
              >
                <Link href={`/cook/${cook.id}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cook.avatar}
                    alt={cook.name}
                    className="size-14 rounded-full object-cover"
                  />
                </Link>
                <Link
                  href={`/cook/${cook.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-[15.5px] font-semibold text-charcoal">
                    {cook.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {cook.rating.toFixed(1)} · {cook.area[lang]}, {cook.city}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[12.5px] text-terracotta">
                    {loc(cook.specialties, lang)}
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {t("nextAvailable")} · {t("todayShort")} 18:00
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={t("toastCookFavRemoved")}
                  onClick={() => {
                    toggleFavoriteCook(cook.id);
                    toast(t("toastCookFavRemoved"));
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-terracotta-50 text-terracotta"
                >
                  <Heart className="size-4 fill-terracotta" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            icon={<UtensilsCrossed className="size-7" />}
            title={t("emptyFavTitle")}
            description={t("emptyFavSub")}
            action={
              <Link href="/explore">
                <Button>{t("seeAllCooks")}</Button>
              </Link>
            }
          />
        )}

        <div className="mt-8 hidden items-center justify-between rounded-2xl border border-line bg-white/60 px-5 py-4 md:flex">
          <p className="text-[13.5px] text-muted">{t("emptyFavSub")}</p>
          <Link href="/explore" className="text-[13.5px] font-semibold text-terracotta">
            {t("exploreFood")}
          </Link>
        </div>
      </div>
    </div>
  );
}
