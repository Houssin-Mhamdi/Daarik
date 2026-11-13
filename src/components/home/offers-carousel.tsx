"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { loc, type Dish } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";
import { EmptyNotice } from "./empty-notice";
import { FeaturedBadge } from "./kitchen-status";

/** Mobile swipe carousel of featured offers, one card per cook. */
export function OffersCarousel({ offers }: { offers: Dish[] }) {
  const { t, lang, cooks } = useApp();
  const [active, setActive] = useState(0);

  return (
    <>
      <div
        onScroll={(event) => {
          const el = event.currentTarget;
          const first = el.firstElementChild as HTMLElement | null;
          if (!first) return;
          setActive(Math.round(Math.abs(el.scrollLeft) / (first.offsetWidth + 12)));
        }}
        className="mt-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 no-scrollbar"
      >
        {offers.length > 0 ? (
          offers.map((dish) => {
            const cook = cooks.find((item) => item.id === dish.cookId);
            return (
              <Link
                key={dish.id}
                href={`/dish/${dish.id}`}
                className="group relative block h-[236px] w-[82%] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-[26px] bg-charcoal shadow-card"
              >
                <Image
                  src={dish.image || "/img/daarik-logo.png"}
                  alt={loc(dish.name, lang)}
                  fill
                  sizes="82vw"
                  loading="eager"
                  unoptimized
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />
                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <FeaturedBadge
                    closed={cook?.kitchenOpen === false}
                    label={dish.weekend ? t("weekendSpecial") : t("liveNow")}
                    iconClassName="size-2.5"
                  />
                  <span className="flex items-center gap-0.5 rounded-full bg-charcoal/50 px-2 py-1 text-[12px] font-semibold text-white backdrop-blur">
                    <Star className="size-2.5 fill-saffron text-saffron" />
                    {dish.rating.toFixed(1)}
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-3">
                  <p className="line-clamp-1 font-display text-[22px] leading-tight text-white">
                    {loc(dish.name, lang)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Image
                      src={cook?.avatar || "/img/daarik-logo.png"}
                      alt={cook?.name ?? ""}
                      width={22}
                      height={22}
                      unoptimized
                      className="size-[22px] rounded-full border border-white/70 object-cover"
                    />
                    <p className="line-clamp-1 text-[12.5px] text-white/80">
                      {cook?.name} · {cook?.city}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[17px] font-semibold text-white">
                      {formatPrice(dish.price, lang)}
                      <span className="ms-1 text-[11.5px] font-normal text-white/70">
                        {t("perPortion")}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-charcoal">
                      {dish.portionsLeft <= 3
                        ? t("onlyLeft", { count: dish.portionsLeft })
                        : t("preOrder")}
                      <ArrowRight className="size-2.5 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <EmptyNotice className="w-full" />
        )}
      </div>
      {offers.length > 1 ? (
        <div className="mt-1 flex justify-center gap-1.5">
          {offers.map((dish, index) => (
            <span
              key={dish.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === Math.min(active, offers.length - 1)
                  ? "w-5 bg-terracotta"
                  : "w-1.5 bg-line",
              )}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
