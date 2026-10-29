"use client";

import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  getCook,
  getCuisine,
  loc,
  type Dish,
} from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DishCard({
  dish,
  variant = "grid",
  showCook = true,
  className,
}: {
  dish: Dish;
  variant?: "grid" | "wide" | "compact";
  showCook?: boolean;
  className?: string;
}) {
  const { t, lang, addToCart, toggleFavorite, isFavorite, toast } = useApp();
  const cook = getCook(dish.cookId);
  const cuisine = getCuisine(dish.cuisineId);
  const favorite = isFavorite(dish.id);
  const soldOut = dish.portionsLeft <= 0;
  const lowStock = dish.portionsLeft > 0 && dish.portionsLeft <= 3;

  const heart = (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggleFavorite(dish.id);
        toast(added ? t("toastFavAdded") : t("toastFavRemoved"), {
          variant: "success",
        });
      }}
      aria-label={favorite ? t("toastFavRemoved") : t("toastFavAdded")}
      aria-pressed={favorite}
      className="absolute end-2.5 top-2.5 z-20 grid size-9 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:bg-white active:scale-95"
    >
      <Heart
        className={cn(
          "size-[17px] transition-colors",
          favorite ? "fill-terracotta text-terracotta" : "text-charcoal/70",
        )}
      />
    </button>
  );

  const addButton = (
    <button
      type="button"
      disabled={soldOut}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        addToCart(dish.id);
      }}
      aria-label={t("addToCart")}
      className={cn(
        "z-20 grid size-9 shrink-0 place-items-center rounded-full shadow-[0_8px_18px_-10px_rgba(198,93,58,0.9)] transition active:scale-95",
        soldOut
          ? "bg-cream-200 text-muted-soft"
          : "bg-terracotta text-white hover:bg-terracotta-600",
      )}
    >
      <Plus className="size-[18px]" strokeWidth={2.4} />
    </button>
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border border-line/80 bg-white p-2.5 shadow-card",
          className,
        )}
      >
        <Link
          href={`/dish/${dish.id}`}
          className="relative size-[76px] shrink-0 overflow-hidden rounded-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dish.image}
            alt={loc(dish.name, lang)}
            className={cn(
              "size-full object-cover transition duration-500 group-hover:scale-105",
              soldOut && "grayscale",
            )}
          />
          {dish.badge && !soldOut ? (
            <span className="absolute inset-x-1 bottom-1 rounded-full bg-charcoal/80 px-1.5 py-0.5 text-center text-[10.5px] font-semibold text-white backdrop-blur">
              {loc(dish.badge, lang)}
            </span>
          ) : null}
        </Link>
        <Link href={`/dish/${dish.id}`} className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
            <span aria-hidden>{cuisine?.flag}</span>
            {cuisine ? loc(cuisine.label, lang) : null}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-charcoal">
            {loc(dish.name, lang)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {showCook && cook ? `${cook.name} · ` : ""}
            {dish.serves} {t("people")}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-charcoal">
            {formatPrice(dish.price, lang)}
          </p>
        </Link>
        {addButton}
      </div>
    );
  }

  if (variant === "wide") {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-[24px] border border-line/80 bg-white shadow-card transition hover:shadow-lift",
          className,
        )}
      >
        <div className="flex flex-col sm:flex-row">
          <Link
            href={`/dish/${dish.id}`}
            className="relative block aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:w-[45%] sm:shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dish.image}
              alt={loc(dish.name, lang)}
              className={cn(
                "size-full object-cover transition duration-700 group-hover:scale-105",
                soldOut && "grayscale",
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent sm:hidden" />
            {dish.badge ? (
              <Badge
                variant="glass"
                size="sm"
                className="absolute start-3 top-3"
              >
                {loc(dish.badge, lang)}
              </Badge>
            ) : null}
          </Link>
          {heart}
          <div className="flex min-w-0 flex-1 flex-col p-4">
            <Link href={`/dish/${dish.id}`} className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.12em] text-terracotta">
                <span aria-hidden>{cuisine?.flag}</span>
                {cuisine ? loc(cuisine.label, lang) : null}
                {lowStock ? (
                  <span className="ms-auto rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold tracking-normal text-[#8a5d13]">
                    {t("onlyLeft", { count: dish.portionsLeft })}
                  </span>
                ) : null}
              </p>
              <h3 className="mt-1.5 font-display text-[23px] leading-tight text-charcoal">
                {loc(dish.name, lang)}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">
                {loc(dish.desc, lang)}
              </p>
            </Link>
            {showCook && cook ? (
              <Link
                href={`/cook/${cook.id}`}
                className="mt-3 flex w-fit items-center gap-2 rounded-full border border-line/70 bg-cream/50 py-1 pe-2.5 ps-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cook.avatar}
                  alt={cook.name}
                  className="size-6 rounded-full object-cover"
                />
                <span className="text-[13px] font-semibold text-charcoal">
                  {cook.name}
                </span>
                <span className="text-[12px] text-muted">
                  {cook.area[lang]}
                </span>
              </Link>
            ) : null}
            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
              <div>
                <p className="flex items-baseline gap-1">
                  <span className="text-[21px] font-semibold text-charcoal">
                    {formatPrice(dish.price, lang)}
                  </span>
                  <span className="text-[12.5px] text-muted">
                    {t("perPortion")}
                  </span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                  <Star className="size-3 fill-saffron text-saffron" />
                  {dish.rating.toFixed(1)} · {dish.serves} {t("people")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-[12.5px] font-medium text-muted sm:block">
                  {soldOut ? t("soldOut") : t("addToCart")}
                </span>
                {addButton}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border border-line/80 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <Link
        href={`/dish/${dish.id}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dish.image}
          alt={loc(dish.name, lang)}
          className={cn(
            "size-full object-cover transition duration-700 group-hover:scale-105",
            soldOut && "grayscale",
          )}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          {dish.badge ? (
            <Badge variant="glass" size="sm" className="shadow-sm">
              {loc(dish.badge, lang)}
            </Badge>
          ) : lowStock ? (
            <Badge variant="saffron" size="sm" className="shadow-sm">
              {t("onlyLeft", { count: dish.portionsLeft })}
            </Badge>
          ) : (
            <span />
          )}
        </div>
        {soldOut ? (
          <div className="absolute inset-0 grid place-items-center bg-charcoal/35 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-bold text-charcoal">
              {t("soldOut")}
            </span>
          </div>
        ) : null}
      </Link>
      {heart}
      <Link href={`/dish/${dish.id}`} className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-terracotta">
            <span aria-hidden>{cuisine?.flag}</span>
            {cuisine ? loc(cuisine.label, lang) : null}
          </span>
          <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-charcoal">
            <Star className="size-2.5 fill-saffron text-saffron" />
            {dish.rating.toFixed(1)}
            <span className="font-normal text-muted-soft">
              ({dish.reviewCount})
            </span>
          </span>
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-[34px] text-[15.5px] font-semibold leading-snug text-charcoal">
          {loc(dish.name, lang)}
        </h3>
        {showCook && cook ? (
          <p className="mt-1 truncate text-[12.5px] text-muted">
            {cook.name} · {cook.area[lang]}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div>
            <p className="text-[17px] font-semibold leading-none text-charcoal">
              {formatPrice(dish.price, lang)}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {dish.serves} {t("people")} · {loc(dish.prepTime, lang)}
            </p>
          </div>
          {addButton}
        </div>
      </Link>
    </div>
  );
}

export function DishRow({
  dish,
  className,
}: {
  dish: Dish;
  className?: string;
}) {
  return <DishCard dish={dish} variant="compact" className={className} />;
}
