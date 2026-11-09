"use client";

import { Suspense, useState } from "react";
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
import {
  useDishesPaginatedQuery,
  useCooksPaginatedQuery,
} from "@/lib/queries";



function SearchResults() {
  const { t } = useApp();
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();

  const [dishPage, setDishPage] = useState(1);
  const [cookPage, setCookPage] = useState(1);

  const dishQuery = useDishesPaginatedQuery(
    q.length >= 3 ? { q, page: String(dishPage), limit: "12" } : undefined,
  );
  const cookQuery = useCooksPaginatedQuery(
    q.length >= 3 ? { q, page: String(cookPage), limit: "8" } : undefined,
  );

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

  const dishes = dishQuery.data?.items ?? [];
  const dishTotal = dishQuery.data?.total ?? 0;
  const dishTotalPages = Math.max(1, Math.ceil(dishTotal / 12));
  const cooks = cookQuery.data?.items ?? [];
  const cookTotal = cookQuery.data?.total ?? 0;
  const cookTotalPages = Math.max(1, Math.ceil(cookTotal / 8));

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
            {t("searchDishesTitle")} ({dishTotal})
          </h2>
        </div>
        {dishQuery.isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton aspect-[4/3] w-full rounded-3xl"
              />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Soup className="size-7" />}
            title={t("searchNoResultsTitle")}
            description={t("searchNoResultsSub", { query: q })}
          />
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {dishes.map((dish) => (
                <DishCard dish={dish} key={dish.id} />
              ))}
            </div>
            <Pagination
              page={dishPage}
              totalPages={dishTotalPages}
              onPage={setDishPage}
            />
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-charcoal">
          {t("searchCooksTitle")} ({cookTotal})
        </h2>
        {cookQuery.isLoading ? null : cooks.length === 0 ? null : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {cooks.map((cook) => (
                <CookCard cook={cook} key={cook.id} />
              ))}
            </div>
            <Pagination
              page={cookPage}
              totalPages={cookTotalPages}
              onPage={setCookPage}
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
