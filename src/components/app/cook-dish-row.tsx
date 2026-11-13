"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ChefHat, Minus, Plus, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { loc, type Cook, type Dish } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

function DishTile({ dish, closed }: { dish: Dish; closed: boolean }) {
  const { lang, t, cart, addToCart, setQty } = useApp();
  const qty = cart.find((line) => line.dishId === dish.id)?.qty ?? 0;
  const soldOut = closed || dish.portionsLeft <= 0;

  return (
    <div className="w-[112px] shrink-0 md:w-[168px]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-100">
        <Link href={`/dish/${dish.id}`} className="absolute inset-0">
          <Image
            src={dish.image}
            alt={loc(dish.name, lang)}
            fill
            sizes="168px"
            loading="lazy"
            unoptimized
            className={cn("object-cover", soldOut && "grayscale")}
          />
        </Link>
        {qty > 0 ? (
          <div className="absolute inset-x-1.5 bottom-1.5 z-10 flex items-center justify-between rounded-full bg-white p-1 shadow-card">
            <button
              type="button"
              onClick={() => setQty(dish.id, qty - 1)}
              aria-label="-"
              className="grid size-7 place-items-center rounded-full bg-terracotta/10 text-terracotta"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-[14px] font-bold text-charcoal">{qty}</span>
            <button
              type="button"
              onClick={() => addToCart(dish.id, 1, dish)}
              aria-label={t("addToCart")}
              className="grid size-7 place-items-center rounded-full bg-terracotta text-white"
            >
              <Plus className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={soldOut}
            onClick={() => addToCart(dish.id, 1, dish)}
            aria-label={t("addToCart")}
            className={cn(
              "absolute bottom-1.5 end-1.5 z-10 grid size-8 place-items-center rounded-full shadow-card transition active:scale-95",
              soldOut
                ? "bg-cream-200 text-muted-soft"
                : "bg-terracotta text-white",
            )}
          >
            <Plus className="size-[18px]" strokeWidth={2.4} />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[13px] font-bold text-charcoal">
        {formatPrice(dish.price, lang)}
      </p>
      <Link
        href={`/dish/${dish.id}`}
        className="line-clamp-2 text-[12.5px] leading-snug text-charcoal/80"
      >
        {loc(dish.name, lang)}
      </Link>
    </div>
  );
}

export function CookDishRow({ cook, dishes }: { cook: Cook; dishes: Dish[] }) {
  const { lang } = useApp();

  return (
    <section className="mt-4">
      <Link href={`/cook/${cook.id}`} className="flex items-center gap-3">
        {cook.avatar ? (
          <Image
            src={cook.avatar}
            alt={cook.name}
            width={44}
            height={44}
            loading="lazy"
            unoptimized
            className="size-11 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
            <ChefHat className="size-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[15px] font-bold text-charcoal">
            <span className="truncate">{cook.name}</span>
            {cook.verified ? (
              <BadgeCheck className="size-4 shrink-0 fill-olive text-white" />
            ) : null}
          </p>
          <p className="truncate text-[13px] text-muted">
            {loc(cook.specialties, lang)}
          </p>
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <Star className="size-3 fill-saffron text-saffron" />
            {cook.rating.toFixed(1)} ({cook.reviewCount})
            <span>·</span>
            {cook.area[lang]}, {cook.city}
          </p>
        </div>
      </Link>
      <div className="-mx-4 mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
        {dishes.map((dish) => (
          <DishTile
            key={dish.id}
            dish={dish}
            closed={cook.kitchenOpen === false}
          />
        ))}
      </div>
    </section>
  );
}
