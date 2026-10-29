"use client";

import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { dishesByCook, loc, type Cook } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CookCard({
  cook,
  variant = "grid",
  className,
}: {
  cook: Cook;
  variant?: "grid" | "compact" | "spotlight";
  className?: string;
}) {
  const { t, lang } = useApp();
  const dishes = dishesByCook(cook.id);

  if (variant === "compact") {
    return (
      <Link
        href={`/cook/${cook.id}`}
        className={cn(
          "group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center",
          className,
        )}
      >
        <span className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cook.avatar}
            alt={cook.name}
            className="size-[68px] rounded-full object-cover p-[3px] ring-2 ring-terracotta/40 ring-offset-2 ring-offset-cream transition group-hover:ring-terracotta"
          />
          {cook.verified ? (
            <span className="absolute -bottom-0.5 -end-0.5 grid size-5 place-items-center rounded-full bg-white">
              <BadgeCheck className="size-4 fill-olive text-white" />
            </span>
          ) : null}
        </span>
        <span className="w-full truncate text-[13px] font-semibold text-charcoal">
          {cook.name.split(" ")[0]}
        </span>
        <span className="-mt-1.5 w-full truncate text-[11.5px] text-muted">
          {cook.area[lang]}
        </span>
      </Link>
    );
  }

  if (variant === "spotlight") {
    return (
      <Link
        href={`/cook/${cook.id}`}
        className={cn(
          "group relative block overflow-hidden rounded-[26px] bg-charcoal text-white shadow-card",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cook.cover}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-80 transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/45 to-transparent" />
        <div className="relative flex min-h-[264px] flex-col justify-end p-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cook.avatar}
              alt={cook.name}
              className="size-11 rounded-full border-2 border-white/90 object-cover"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[15px] font-semibold">
                {cook.name}
                {cook.verified ? (
                  <BadgeCheck className="size-3.5 fill-cream text-olive" />
                ) : null}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-white/70">
                <MapPin className="size-3" />
                {cook.area[lang]}, {cook.city}
              </p>
            </div>
          </div>
          <p className="mt-3 font-display text-[24px] leading-tight">
            {loc(cook.specialties, lang)}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[13px] text-white/80">
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-saffron text-saffron" />
              {cook.rating.toFixed(1)} ({cook.reviewCount})
            </span>
            <span>·</span>
            <span>
              {dishes.length} {t("dishes")}
            </span>
            <span className="ms-auto rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] backdrop-blur">
              {t("pickupOnly")}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/cook/${cook.id}`}
      className={cn(
        "group overflow-hidden rounded-[22px] border border-line/80 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative h-[98px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cook.cover}
          alt=""
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
        <span className="absolute end-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11.5px] font-bold text-charcoal backdrop-blur">
          <Star className="size-2.5 fill-saffron text-saffron" />
          {cook.rating.toFixed(1)}
        </span>
      </div>
      <div className="relative px-3 pb-3">
        <div className="-mt-6 flex items-end justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cook.avatar}
            alt={cook.name}
            className="size-12 rounded-full border-[3px] border-white object-cover"
          />
          <span className="mb-0.5 rounded-full bg-olive-50 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-olive-600">
            {cook.cuisineIds.length > 1
              ? t("cuisines")
              : t("verifiedCook")}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[15px] font-semibold text-charcoal">
          <span className="truncate">{cook.name}</span>
          {cook.verified ? (
            <BadgeCheck className="size-3.5 shrink-0 fill-olive text-white" />
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {cook.area[lang]} · {cook.city}
        </p>
        <p className="mt-1.5 truncate text-[12.5px] font-medium text-terracotta">
          {loc(cook.specialties, lang)}
        </p>
      </div>
    </Link>
  );
}
