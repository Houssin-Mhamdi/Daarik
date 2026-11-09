"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Soup } from "lucide-react";
import { DishCard } from "@/components/app/dish-card";
import { CookCard } from "@/components/app/cook-card";
import { Highlight } from "@/components/app/highlight";
import { PageSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/overlays";

import { Pagination } from "@/components/ui/pagination";
import { useApp } from "@/components/providers/app-provider";
import { usePagination } from "@/hooks/use-pagination";
import { loc } from "@/lib/data";


function SearchResults() {
  const { t, lang, dishes, cooks } = useApp();
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const lower = q.toLowerCase();

  const matchingDishes = useMemo(() => {
    if (q.length < 3) return [];
    return dishes.filter((dish) => {
      return (
        loc(dish.name, lang).toLowerCase().includes(lower) ||
        loc(dish.desc, lang).toLowerCase().includes(lower) ||
        (cooks.find((c) => c.id === dish.cookId)?.name ?? "")
          .toLowerCase()
          .includes(lower)
      );
    });
  }, [dishes, cooks, lang, lower, q]);

  const matchingCooks = useMemo(() => {
    if (q.length < 3) return [];
    return cooks.filter(
      (cook) =>
        cook.name.toLowerCase().includes(lower) ||
        cook.city.toLowerCase().includes(lower),
    );
  }, [cooks, lower, q]);

  const dishPag = usePagination(matchingDishes, 12);
  const cookPag = usePagination(matchingCooks, 8);

  if (q.length < 3) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-8">
        <EmptyState
          icon={<Search className="size-7" />}
          title={t("searchMinChars")}
          description={t("browseAll")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
            {t("searchResultsFor", { query: q })}
          </p>
          <h1 className="mt-1 font-display text-[28px] leading-tight text-charcoal md:text-[34px]">
            <Highlight text={q} query={q} />
          </h1>
        </div>
        <Link
          href="/explore"
          className="text-[13.5px] font-semibold text-terracotta"
        >
          {t("browseAll")}
        </Link>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-charcoal">
            {t("searchDishesTitle")} ({matchingDishes.length})
          </h2>
        </div>
        {matchingDishes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Soup className="size-7" />}
            title={t("searchNoResultsTitle")}
            description={t("searchNoResultsSub", { query: q })}
          />
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {dishPag.pageItems.map((dish) => (
                <DishCard dish={dish} key={dish.id} />
              ))}
            </div>
            <Pagination
              page={dishPag.page}
              totalPages={dishPag.totalPages}
              onPage={dishPag.setPage}
            />
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-charcoal">
          {t("searchCooksTitle")} ({matchingCooks.length})
        </h2>
        {matchingCooks.length === 0 ? null : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {cookPag.pageItems.map((cook) => (
                <CookCard cook={cook} key={cook.id} />
              ))}
            </div>
            <Pagination
              page={cookPag.page}
              totalPages={cookPag.totalPages}
              onPage={cookPag.setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchResults />
    </Suspense>
  );
}
