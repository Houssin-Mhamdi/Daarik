"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { loc, type Cook, type Dish } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { FeaturedBadge } from "./kitchen-status";

/** Large desktop hero card for the rotating featured dish. */
export function HeroDishCard({ dish, cook }: { dish: Dish; cook: Cook }) {
  const { t, lang } = useApp();

  return (
    <Link
      key={dish.id}
      href={`/dish/${dish.id}`}
      className="group relative block animate-fade-in overflow-hidden rounded-[32px] bg-charcoal shadow-lift"
    >
      <Image
        src={dish.image || "/img/couscous.jpg"}
        alt={loc(dish.name, lang)}
        width={1200}
        height={420}
        priority
        unoptimized
        className="h-[420px] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
      <div className="absolute inset-x-6 top-6 flex items-center justify-between">
        <FeaturedBadge
          closed={cook.kitchenOpen === false}
          label={t("weekendSpecial")}
        />
        <span className="flex items-center gap-1 rounded-full bg-charcoal/45 px-2.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
          <Star className="size-3 fill-saffron text-saffron" />
          {dish.rating.toFixed(1)} · {dish.reviewCount} {t("reviews")}
        </span>
      </div>
      <div className="absolute inset-x-6 bottom-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">
          {t("cookKitchen", { name: cook.name.split(" ")[0] ?? "" })}
        </p>
        <p className="mt-1 font-display text-[32px] leading-tight text-white">
          {loc(dish.name, lang)}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Image
              src={cook.avatar || "/img/daarik-logo.png"}
              alt={cook.name}
              width={36}
              height={36}
              loading="lazy"
              unoptimized
              className="size-9 rounded-full border-2 border-white/80 object-cover"
            />
            <span className="text-[14px] text-white/85">
              {cook.name}
              <span className="mt-0.5 block text-[12px] text-white/60">
                {cook.area[lang]} · {cook.city}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[21px] font-semibold text-white">
              {formatPrice(dish.price, lang)}
            </span>
            <span className="grid size-11 place-items-center rounded-full bg-white text-charcoal transition group-hover:bg-terracotta group-hover:text-white">
              <ArrowRight className="size-5 rtl:rotate-180" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
