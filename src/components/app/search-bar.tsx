"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/ui/overlays";
import { Rating } from "@/components/ui/controls";
import { useApp } from "@/components/providers/app-provider";
import { cuisines, dishes, getCook, loc, cooks } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

export function SearchBar({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "inline";
  className?: string;
}) {
  const { t, lang, dir } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return dishes
      .filter((dish) => {
        const cook = getCook(dish.cookId);
        return (
          loc(dish.name, lang).toLowerCase().includes(q) ||
          loc(dish.desc, lang).toLowerCase().includes(q) ||
          loc(getCuisineLabel(dish.cuisineId), lang).toLowerCase().includes(q) ||
          cook?.name.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);
  }, [query, lang]);

  const cookResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cooks
      .filter(
        (cook) =>
          cook.name.toLowerCase().includes(q) ||
          cook.city.toLowerCase().includes(q),
      )
      .slice(0, 2);
  }, [query]);

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    try {
      window.sessionStorage.setItem("darna.search", q);
    } catch {
      /* ignore */
    }
    setOpen(false);
    router.push("/explore");
  };

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group flex h-13 w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 text-start shadow-card transition hover:border-line-strong",
            className,
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
            <Search className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-muted">
              {t("searchDish")}
            </span>
          </span>
          <span className="hidden h-7 shrink-0 items-center rounded-full border border-line px-2.5 text-[12px] font-semibold text-muted-soft sm:flex">
            {t("search")}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-full border border-line bg-white px-4 text-start text-[15px] text-muted transition hover:border-line-strong",
            className,
          )}
        >
          <Search className="size-4 shrink-0 text-muted-soft" />
          <span className="truncate">{t("searchShort")}</span>
          <SlidersHorizontal className="ms-auto size-4 shrink-0 text-muted-soft" />
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} className="md:max-w-2xl">
        <div className="sticky -top-5 z-10 -mx-5 flex items-center gap-2.5 border-b border-line/70 bg-cream/95 px-5 pb-3 pt-1 backdrop-blur">
          <span className="flex h-11 flex-1 items-center gap-2.5 rounded-full border border-line bg-white px-4">
            <Search className="size-4 shrink-0 text-muted-soft" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit(query);
              }}
              placeholder={t("searchCooks")}
              className="h-full w-full bg-transparent text-[16px] text-charcoal outline-none placeholder:text-muted-soft"
              dir={dir}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-muted"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[15px] font-semibold text-muted"
          >
            {t("cancel")}
          </button>
        </div>

        {!query.trim() ? (
          <div className="pt-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-muted-soft">
              {t("browseCuisines")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cuisines.map((cuisine) => (
                <Link
                  key={cuisine.id}
                  href="/explore"
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem(
                        "darna.search",
                        loc(cuisine.label, lang),
                      );
                    } catch {
                      /* ignore */
                    }
                    setOpen(false);
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[14.5px] font-semibold text-charcoal transition hover:border-line-strong"
                >
                  <span aria-hidden>{cuisine.flag}</span>
                  {loc(cuisine.label, lang)}
                </Link>
              ))}
            </div>

            <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-muted-soft">
              {t("weekendPicks")}
            </p>
            <div className="mt-3 space-y-2">
              {dishes
                .filter((dish) => dish.featured || dish.family)
                .slice(0, 3)
                .map((dish) => (
                  <Link
                    key={dish.id}
                    href={`/dish/${dish.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition hover:border-line-strong"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.image}
                      alt={loc(dish.name, lang)}
                      className="size-14 rounded-xl object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-charcoal">
                        {loc(dish.name, lang)}
                      </span>
                      <span className="mt-0.5 block truncate text-[13.5px] text-muted">
                        {getCook(dish.cookId)?.name} · {dish.serves}{" "}
                        {t("people")}
                      </span>
                    </span>
                    <span className="text-[15px] font-semibold text-charcoal">
                      {formatPrice(dish.price, lang)}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        ) : results.length === 0 && cookResults.length === 0 ? (
          <div className="py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-cream-100 text-terracotta">
              <Search className="size-6" />
            </span>
            <p className="mt-4 text-base font-semibold text-charcoal">
              {t("searchNoResultsTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-[14.5px] text-muted">
              {t("browseAll")}
            </p>
          </div>
        ) : (
          <div className="space-y-5 pt-4">
            {results.length > 0 ? (
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-muted-soft">
                  {t("dishes")}
                </p>
                <div className="mt-2.5 space-y-2">
                  {results.map((dish) => (
                    <Link
                      key={dish.id}
                      href={`/dish/${dish.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition hover:border-line-strong"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dish.image}
                        alt={loc(dish.name, lang)}
                        className="size-14 rounded-xl object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-charcoal">
                          {loc(dish.name, lang)}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <Rating value={dish.rating} />
                          <span className="truncate text-[13px] text-muted">
                            {getCook(dish.cookId)?.name}
                          </span>
                        </span>
                      </span>
                      <span className="text-[15px] font-semibold text-charcoal">
                        {formatPrice(dish.price, lang)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {cookResults.length > 0 ? (
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-muted-soft">
                  {t("topCooks")}
                </p>
                <div className="mt-2.5 space-y-2">
                  {cookResults.map((cook) => (
                    <Link
                      key={cook.id}
                      href={`/cook/${cook.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-line-strong"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cook.avatar}
                        alt={cook.name}
                        className="size-10 rounded-full object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-charcoal">
                          {cook.name}
                        </span>
                        <span className="text-[13.5px] text-muted">
                          {cook.area[lang]} · {cook.city}
                        </span>
                      </span>
                      <Rating value={cook.rating} count={cook.reviewCount} />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => submit(query)}
              className="flex w-full items-center justify-between rounded-2xl bg-terracotta-50 px-4 py-3 text-start text-[15px] font-semibold text-terracotta-700"
            >
              {t("searchResultsFor", { query: query.trim() })}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" />
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function getCuisineLabel(id: string) {
  return (
    cuisines.find((cuisine) => cuisine.id === id)?.label ?? {
      nl: id,
      en: id,
      ar: id,
    }
  );
}
