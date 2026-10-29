"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Soup,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import { Sheet, EmptyState } from "@/components/ui/overlays";
import { DishCardSkeleton } from "@/components/ui/skeleton";
import { DishCard } from "@/components/app/dish-card";
import { useApp } from "@/components/providers/app-provider";
import { cuisines, getCuisine, loc } from "@/lib/data";
import { cn } from "@/lib/utils";

type Sort = "recommended" | "priceLow" | "priceHigh" | "rating" | "nearest";
type PriceFilter = "low" | "mid" | "high" | null;
type Availability = "today" | "weekend" | null;

const sorts: { value: Sort; key: string }[] = [
  { value: "recommended", key: "sortRecommended" },
  { value: "priceLow", key: "sortPriceLow" },
  { value: "priceHigh", key: "sortPriceHigh" },
  { value: "rating", key: "sortRating" },
  { value: "nearest", key: "sortNearest" },
];

const diets = [
  "vegetarian",
  "vegan",
  "halal",
  "glutenFree",
  "nutFree",
  "dairyFree",
  "spicy",
] as const;

export default function ExplorePage() {
  const { t, lang, dishes } = useApp();
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string>("all");
  const [price, setPrice] = useState<PriceFilter>(null);
  const [availability, setAvailability] = useState<Availability>(null);
  const [diet, setDiet] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("recommended");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [draftCuisine, setDraftCuisine] = useState("all");
  const [draftPrice, setDraftPrice] = useState<PriceFilter>(null);
  const [draftAvailability, setDraftAvailability] =
    useState<Availability>(null);
  const [draftDiet, setDraftDiet] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem("darna.search");
      if (stored) {
        setQuery(stored);
        window.sessionStorage.removeItem("darna.search");
      }
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = dishes.filter((dish) => {
      const cuisineMatch =
        cuisine === "all" || dish.cuisineId === cuisine;
      const priceMatch =
        !price ||
        (price === "low" && dish.price < 10) ||
        (price === "mid" && dish.price >= 10 && dish.price <= 15) ||
        (price === "high" && dish.price > 15);
      const availabilityMatch =
        !availability ||
        (availability === "weekend" &&
          (dish.weekend || dish.pickup.includes("sat-31"))) ||
        (availability === "today" && dish.pickup.includes("fri-30"));
      const dietMatch = diet.every((item) => dish.dietary.includes(item));
      const queryMatch =
        !q ||
        loc(dish.name, lang).toLowerCase().includes(q) ||
        loc(dish.desc, lang).toLowerCase().includes(q) ||
        loc(getCuisine(dish.cuisineId)?.label ?? "", lang)
          .toLowerCase()
          .includes(q);
      return (
        cuisineMatch && priceMatch && availabilityMatch && dietMatch && queryMatch
      );
    });

    result = [...result].sort((a, b) => {
      if (sort === "priceLow") return a.price - b.price;
      if (sort === "priceHigh") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "nearest") return a.cookId.localeCompare(b.cookId);
      return Number(b.featured ?? false) - Number(a.featured ?? false);
    });
    return result;
  }, [dishes, query, cuisine, price, availability, diet, sort, lang]);

  const activeFilters =
    (cuisine !== "all" ? 1 : 0) +
    (price ? 1 : 0) +
    (availability ? 1 : 0) +
    diet.length;

  const openFilters = () => {
    setDraftCuisine(cuisine);
    setDraftPrice(price);
    setDraftAvailability(availability);
    setDraftDiet(diet);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setCuisine(draftCuisine);
    setPrice(draftPrice);
    setAvailability(draftAvailability);
    setDiet(draftDiet);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setCuisine("all");
    setPrice(null);
    setAvailability(null);
    setDiet([]);
    setQuery("");
    setDraftCuisine("all");
    setDraftPrice(null);
    setDraftAvailability(null);
    setDraftDiet([]);
  };

  const toggleDiet = (value: string) => {
    setDraftDiet((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  return (
    <div className="pb-6 md:pb-8">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1240px] md:px-8 md:pt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("homemadeNear")}
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-tight text-charcoal md:text-[38px]">
              {t("exploreTitle")}
            </h1>
            <p className="mt-1 text-[14px] text-muted md:text-sm">
              {t("exploreSub")}
            </p>
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13.5px] font-semibold text-charcoal shadow-sm"
          >
            <MapPin className="size-3.5 text-terracotta" />
            Rotterdam
            <ChevronDown className="size-3 text-muted" />
          </button>
        </div>

        <div className="sticky top-0 z-30 -mx-4 mt-4 bg-cream/92 px-4 py-2 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchCooks")}
                className="h-11 rounded-full border-line bg-white pe-10 ps-11 text-[15.5px] shadow-sm md:max-w-md"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("clearSearch")}
                  className="absolute end-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-cream-100 text-muted"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-white text-charcoal shadow-sm"
              aria-label={t("sortBy")}
            >
              <ArrowUpDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={openFilters}
              className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-charcoal bg-charcoal px-4 text-[14px] font-semibold text-cream shadow-sm"
            >
              <SlidersHorizontal className="size-3.5" />
              {activeFilters > 0
                ? t("filtersCount", { count: activeFilters })
                : t("filters")}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar md:flex-wrap">
          <button
            type="button"
            onClick={() => setCuisine("all")}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold transition",
              cuisine === "all"
                ? "border-terracotta bg-terracotta text-white"
                : "border-line bg-white text-charcoal",
            )}
          >
            <Soup className="size-3.5" />
            {t("allCuisines")}
          </button>
          {cuisines.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setCuisine(cuisine === item.id ? "all" : item.id)
              }
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold transition",
                cuisine === item.id
                  ? "border-terracotta bg-terracotta text-white"
                  : "border-line bg-white text-charcoal",
              )}
            >
              <span aria-hidden>{item.flag}</span>
              {loc(item.label, lang)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13.5px] font-medium text-charcoal">
            {t("resultsFound", { count: filtered.length })}
          </p>
          <div className="hidden items-center gap-2 md:flex">
            {activeFilters > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[13px] font-semibold text-terracotta"
              >
                {t("clearAll")}
              </button>
            ) : null}
            <span className="flex items-center gap-1 text-[13px] text-muted">
              {t("sortBy")}:
              <button
                type="button"
                onClick={() => setSortOpen(true)}
                className="font-semibold text-charcoal"
              >
                {t(sorts.find((item) => item.value === sort)?.key ?? "sortRecommended")}
              </button>
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <DishCardSkeleton key={index} />
              ))
            : filtered.map((dish) => <DishCard dish={dish} key={dish.id} />)}
        </div>

        {!loading && filtered.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Search className="size-7" />}
            title={query ? t("searchNoResultsTitle") : t("emptyExploreTitle")}
            description={
              query
                ? t("searchNoResultsSub", { query })
                : t("emptyExploreSub")
            }
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {t("clearFilters")}
              </Button>
            }
          />
        ) : null}

        <div className="mt-8 hidden md:flex items-center justify-between rounded-2xl border border-line bg-white/60 px-5 py-3.5">
          <p className="text-[13.5px] text-muted">
            {t("pickupNote")}
          </p>
          <Link
            href="/cook"
            className="text-[13.5px] font-semibold text-terracotta"
          >
            {t("becomeCookCta")}
          </Link>
        </div>
      </div>

      {/* Filters sheet */}
      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t("filtersTitle")}
        description={t("filtersSub")}
        footer={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDraftCuisine("all");
                setDraftPrice(null);
                setDraftAvailability(null);
                setDraftDiet([]);
              }}
            >
              {t("clearFilters")}
            </Button>
            <Button className="flex-[1.4]" onClick={applyFilters}>
              {t("showResults", { count: filtered.length })}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pb-2">
          <section>
            <h3 className="text-[14px] font-bold uppercase tracking-[0.14em] text-muted-soft">
              {t("filterCuisine")}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftCuisine("all")}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[14px] font-semibold",
                  draftCuisine === "all"
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line bg-white text-charcoal",
                )}
              >
                {t("all")}
              </button>
              {cuisines.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraftCuisine(item.id)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold",
                    draftCuisine === item.id
                      ? "border-terracotta bg-terracotta text-white"
                      : "border-line bg-white text-charcoal",
                  )}
                >
                  <span aria-hidden>{item.flag}</span>
                  {loc(item.label, lang)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-bold uppercase tracking-[0.14em] text-muted-soft">
              {t("filterPrice")}
            </h3>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(
                [
                  { value: "low", key: "priceLow" },
                  { value: "mid", key: "priceMid" },
                  { value: "high", key: "priceHigh" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setDraftPrice(draftPrice === item.value ? null : item.value)
                  }
                  className={cn(
                    "h-11 rounded-xl border text-[13.5px] font-semibold",
                    draftPrice === item.value
                      ? "border-charcoal bg-charcoal text-cream"
                      : "border-line bg-white text-charcoal",
                  )}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-bold uppercase tracking-[0.14em] text-muted-soft">
              {t("filterAvailability")}
            </h3>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "today", key: "availableToday" },
                  { value: "weekend", key: "availableWeekend" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setDraftAvailability(
                      draftAvailability === item.value ? null : item.value,
                    )
                  }
                  className={cn(
                    "h-11 rounded-xl border text-[13.5px] font-semibold",
                    draftAvailability === item.value
                      ? "border-charcoal bg-charcoal text-cream"
                      : "border-line bg-white text-charcoal",
                  )}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-bold uppercase tracking-[0.14em] text-muted-soft">
              {t("filterDietary")}
            </h3>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {diets.map((item) => (
                <Checkbox
                  key={item}
                  checked={draftDiet.includes(item)}
                  onCheckedChange={() => toggleDiet(item)}
                  label={t(item)}
                  className="px-2"
                />
              ))}
            </div>
          </section>
        </div>
      </Sheet>

      {/* Sort sheet */}
      <Sheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title={t("sortSheetTitle")}
      >
        <div className="space-y-1.5 pt-1">
          {sorts.map((item) => {
            const active = sort === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setSort(item.value);
                  setSortOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-3.5 text-start text-[15px] font-semibold transition",
                  active
                    ? "border-terracotta bg-terracotta-50/60 text-terracotta-700"
                    : "border-line bg-white text-charcoal hover:border-line-strong",
                )}
              >
                {t(item.key)}
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    active
                      ? "border-terracotta bg-terracotta"
                      : "border-line-strong",
                  )}
                >
                  {active ? (
                    <span className="size-2 rounded-full bg-white" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
