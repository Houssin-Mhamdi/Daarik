"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChefHat,
  Check,
  Eye,
  EyeOff,
  Flame,
  Search,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  KpiCard,
  StatusPill,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { loc } from "@/lib/data";
import {
  useAdminDishesPaginatedQuery,
  useAdminModerateDishMutation,
  useAdminRemoveDishMutation,
  type AdminDishRecord,
} from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

type DishRow = {
  id: string;
  name: string;
  desc: string;
  image: string;
  cook: string;
  cookId: string;
  cuisine: string;
  price: number;
  rating: number;
  reviewCount: number;
  portionsLeft: number;
  status: "live" | "paused" | "draft";
  reported?: boolean;
};

type Filter = "all" | "live" | "paused" | "draft" | "reported";

export default function AdminDishesPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideId, setHideId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data: paginated, isPending, isError } = useAdminDishesPaginatedQuery({
    filter: filter === "all" ? undefined : filter,
    q: query.trim() || undefined,
    page: String(page),
    limit: "15",
  });
  const apiDishes = useMemo(() => paginated?.items ?? [], [paginated]);
  const total = paginated?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 15));

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filter, query]);
  const moderateDish = useAdminModerateDishMutation();
  const removeDish = useAdminRemoveDishMutation();

  const rows = useMemo<DishRow[]>(
    () =>
      apiDishes.map((dish: AdminDishRecord) => ({
        id: dish.id,
        name: loc(dish.name, lang),
        desc: loc(dish.desc, lang),
        image: dish.image,
        cook: dish.cook,
        cookId: dish.cookId,
        cuisine: dish.cuisine,
        price: Number(dish.price),
        rating: Number(dish.rating),
        reviewCount: Number(dish.reviewCount),
        portionsLeft: Number(dish.portionsLeft),
        status: dish.status,
        reported: dish.reported,
      })),
    [apiDishes, lang],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      live: rows.filter((row) => row.status === "live").length,
      paused: rows.filter((row) => row.status === "paused").length,
      draft: rows.filter((row) => row.status === "draft").length,
      reported: rows.filter((row) => row.reported).length,
    }),
    [rows],
  );

  const filtered = rows;

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const hideTarget = rows.find((row) => row.id === hideId) ?? null;

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("content")}
        title={t("adminNavDishes")}
        subtitle={t("adminDishesSub")}
        actions={
          <Link
            href="/admin/cooks"
            className="flex h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            <ChefHat className="size-3.5 text-muted" />
            {t("adminNavCooks")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("liveDishes")}
          value={counts.live}
          icon={<UtensilsCrossed className="size-4" />}
          foot={t("liveKitchens")}
        />
        <KpiCard
          label={t("pausedDishes")}
          value={counts.paused}
          icon={<EyeOff className="size-4" />}
          accent="#d9a441"
          foot={t("today")}
        />
        <KpiCard
          label={t("drafts")}
          value={counts.draft}
          icon={<Flame className="size-4" />}
          accent="#697653"
          foot={t("thisWeek")}
        />
        <KpiCard
          label={t("flaggedReviews")}
          value={counts.reported}
          icon={<AlertTriangle className="size-4" />}
          accent="#b3402f"
          foot={t("awaitingReview")}
        />
      </div>

      <AdminCard className="mt-4">
        <div className="flex flex-col gap-3 border-b border-[#f0e9dc] p-3 md:flex-row md:items-center md:p-4">
          <div className="relative min-w-0 flex-1 md:max-w-[300px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchDishes")}
              aria-label={t("searchDishes")}
              className="h-9 w-full rounded-xl border border-line bg-cream/50 ps-9 pe-8 text-[14px] outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="absolute end-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-soft hover:bg-cream-200"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
          <SegmentedTabs
            scrollable
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: t("all"), count: counts.all },
              { value: "live", label: t("live"), count: counts.live },
              { value: "paused", label: t("paused"), count: counts.paused },
              { value: "draft", label: t("draft"), count: counts.draft },
              {
                value: "reported",
                label: t("flaggedReviews"),
                count: counts.reported,
              },
            ]}
            className="min-w-max md:ms-auto"
          />
        </div>

        {isError ? (
          <p role="alert" className="px-5 py-8 text-center text-sm text-danger">
            {t("loadError")}
          </p>
        ) : isPending ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {t("loading")}
          </p>
        ) : (
          <>
            <AdminTable>
            <thead>
              <tr>
                <Th>{t("adminNavDishes")}</Th>
                <Th className="hidden lg:table-cell">{t("cookCol")}</Th>
                <Th className="hidden md:table-cell">{t("filterCuisine")}</Th>
                <Th>{t("price")}</Th>
                <Th className="hidden sm:table-cell">{t("ratingCol")}</Th>
                <Th className="hidden xl:table-cell">{t("portionsLeft")}</Th>
                <Th>{t("statusCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="transition hover:bg-cream/40">
                  <Td>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="flex items-center gap-2.5 text-start"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="lazy"
                        decoding="async"
                        src={row.image}
                        alt=""
                        className="size-9 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="max-w-[220px] truncate font-semibold">
                            {row.name}
                          </span>
                          {row.reported ? (
                            <AlertTriangle className="size-3 shrink-0 text-[#a4412c]" />
                          ) : null}
                        </span>
                        <span className="block truncate text-[12px] text-muted">
                          {row.cuisine}
                        </span>
                      </span>
                    </button>
                  </Td>
                  <Td className="hidden text-muted lg:table-cell">
                    {row.cook}
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Badge variant="outline">{row.cuisine}</Badge>
                  </Td>
                  <Td className="font-semibold">
                    {formatPrice(row.price, lang)}
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
                      <Star className="size-3 fill-saffron text-saffron" />
                      {row.rating.toFixed(1)}
                      <span className="font-normal text-muted">
                        ({row.reviewCount})
                      </span>
                    </span>
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span
                      className={
                        row.portionsLeft === 0
                          ? "text-[13px] font-semibold text-[#a4412c]"
                          : "text-[13px]"
                      }
                    >
                      {row.portionsLeft === 0 ? t("soldOut") : row.portionsLeft}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={row.status} />
                  </Td>
                  <Td className="text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-charcoal transition hover:bg-cream-100"
                    >
                      {t("viewDetails")}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          {filtered.length > 0 ? (
            <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-4" />
          ) : null}
          </>
        )}

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UtensilsCrossed className="mx-auto size-7 text-muted-soft" />
            <p className="mt-3 text-[15.5px] font-semibold text-charcoal">
              {t("noResults")}
            </p>
            <p className="mt-1 text-[13.5px] text-muted">
              {t("noResultsFilters")}
            </p>
          </div>
        ) : null}

        <div className="px-4 py-3 text-[13px] text-muted md:px-5">
          {t("showingResults", { shown: filtered.length, total: rows.length })}
        </div>
      </AdminCard>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name}
        description={
          selected ? `${selected.cook} · ${selected.cuisine}` : undefined
        }
        className="md:max-w-lg"
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  const status = selected.status === "live" ? "PAUSED" : "LIVE";
                  try {
                    await moderateDish.mutateAsync({ id: selected.id, status });
                    toast(
                      status === "PAUSED"
                        ? t("dishHiddenToast")
                        : t("dishRestoredToast"),
                    );
                  } catch {
                    toast(t("loadError"), { variant: "error" });
                  }
                  setSelectedId(null);
                }}
              >
                {selected.status === "live" ? (
                  <>
                    <EyeOff className="size-4" />
                    {t("hideDish")}
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    {t("restoreDish")}
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setHideId(selected.id)}
              >
                {t("removeDish")}
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              decoding="async"
              src={selected.image}
              alt={selected.name}
              className="h-44 w-full rounded-2xl object-cover md:h-52"
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-semibold leading-snug text-charcoal">
                  {selected.name}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {selected.cook} · {selected.cuisine}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[20px] font-semibold text-charcoal">
                  {formatPrice(selected.price, lang)}
                </p>
                <p className="text-[12px] text-muted">{t("price")}</p>
              </div>
            </div>

            {selected.reported ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#f2d9d0] bg-[#fdf3ef] p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#a4412c]" />
                <div>
                  <p className="text-[13.5px] font-semibold text-[#a4412c]">
                    {t("flaggedReviews")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#8a5040]">
                    {t("flaggedDishDesc")}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="text-[14px] leading-relaxed text-muted">
              {selected.desc}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("ratingCol"), value: selected.rating.toFixed(1) },
                { label: t("reviews"), value: selected.reviewCount },
                { label: t("portionsLeft"), value: selected.portionsLeft },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-line bg-white p-3 text-center"
                >
                  <p className="text-[18px] font-semibold leading-none text-charcoal">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-soft">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("moderation")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3e6] px-2 py-1 text-[12px] font-semibold text-[#4f6b3a]">
                  <Check className="size-3" />
                  {t("allergens")} OK
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3e6] px-2 py-1 text-[12px] font-semibold text-[#4f6b3a]">
                  <Check className="size-3" />
                  {t("photo")} OK
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf5e3] px-2 py-1 text-[12px] font-semibold text-[#8a5d13]">
                  <AlertTriangle className="size-3" />
                  {selected.reported
                    ? t("flaggedReviews")
                    : t("awaitingReview")}
                </span>
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-muted-soft">
              {t("adminDishNote")}
            </p>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(hideTarget)}
        onClose={() => setHideId(null)}
        onConfirm={async () => {
          if (hideTarget) {
            try {
              await removeDish.mutateAsync(hideTarget.id);
              toast(t("dishHiddenToast"), {
                description: hideTarget.name,
                variant: "info",
              });
            } catch {
              toast(t("loadError"), { variant: "error" });
            }
          }
          setHideId(null);
          setSelectedId(null);
        }}
        title={t("removeDishTitle")}
        description={t("removeDishDesc")}
        confirmLabel={t("removeDish")}
        cancelLabel={t("cancel")}
        variant="destructive"
      />
    </div>
  );
}
