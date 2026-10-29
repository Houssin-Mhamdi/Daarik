"use client";

import { useMemo, useState } from "react";
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
import { dishes, getCook, loc } from "@/lib/data";
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

const extraDishes: DishRow[] = [
  {
    id: "admin-msemen",
    name: "M'semen met honing",
    desc: "Flaky layered flatbread served warm with honey and butter.",
    image: "/img/brik.jpg",
    cook: "Omar Benali",
    cookId: "omar",
    cuisine: "Moroccan",
    price: 6.5,
    rating: 4.7,
    reviewCount: 22,
    portionsLeft: 0,
    status: "paused",
  },
  {
    id: "admin-fatteh",
    name: "Fatteh met kikkererwten",
    desc: "Crisp bread, chickpeas, yoghurt and pine nuts.",
    image: "/img/kibbeh.jpg",
    cook: "Fatima Haddad",
    cookId: "fatima",
    cuisine: "Syrian",
    price: 11,
    rating: 4.9,
    reviewCount: 18,
    portionsLeft: 4,
    status: "live",
    reported: true,
  },
  {
    id: "admin-maqluba",
    name: "Maqluba met aubergine",
    desc: "Upside-down rice dish with aubergine and spiced chicken.",
    image: "/img/stuffed.jpg",
    cook: "Fatima Haddad",
    cookId: "fatima",
    cuisine: "Syrian",
    price: 15.5,
    rating: 5,
    reviewCount: 11,
    portionsLeft: 6,
    status: "draft",
  },
];

type Filter = "all" | "live" | "paused" | "draft" | "reported";

export default function AdminDishesPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideId, setHideId] = useState<string | null>(null);

  const [rows, setRows] = useState<DishRow[]>(() => [
    ...dishes.map((dish) => ({
      id: dish.id,
      name: loc(dish.name, lang),
      desc: loc(dish.desc, lang),
      image: dish.image,
      cook: getCook(dish.cookId)?.name ?? "",
      cookId: dish.cookId,
      cuisine: dish.cuisineId.charAt(0).toUpperCase() + dish.cuisineId.slice(1),
      price: dish.price,
      rating: dish.rating,
      reviewCount: dish.reviewCount,
      portionsLeft: dish.portionsLeft,
      status: "live" as const,
    })),
    ...extraDishes,
  ]);

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

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "reported"
            ? Boolean(row.reported)
            : row.status === filter;
      const matchesQuery =
        !text ||
        row.name.toLowerCase().includes(text) ||
        row.cook.toLowerCase().includes(text) ||
        row.cuisine.toLowerCase().includes(text);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, rows]);

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
          value={counts.live + 1180}
          icon={<UtensilsCrossed className="size-4" />}
          foot={t("liveKitchens")}
        />
        <KpiCard
          label={t("pausedDishes")}
          value={counts.paused + 42}
          icon={<EyeOff className="size-4" />}
          accent="#d9a441"
          foot={t("today")}
        />
        <KpiCard
          label={t("drafts")}
          value={counts.draft + 27}
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
              { value: "reported", label: t("flaggedReviews"), count: counts.reported },
            ]}
            className="min-w-max md:ms-auto"
          />
        </div>

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
                      src={row.image}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="max-w-[220px] truncate font-semibold">{row.name}</span>
                        {row.reported ? (
                          <AlertTriangle className="size-3 shrink-0 text-[#a4412c]" />
                        ) : null}
                      </span>
                      <span className="block truncate text-[12px] text-muted">{row.cuisine}</span>
                    </span>
                  </button>
                </Td>
                <Td className="hidden text-muted lg:table-cell">{row.cook}</Td>
                <Td className="hidden md:table-cell">
                  <Badge variant="outline">{row.cuisine}</Badge>
                </Td>
                <Td className="font-semibold">{formatPrice(row.price, lang)}</Td>
                <Td className="hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {row.rating.toFixed(1)}
                    <span className="font-normal text-muted">({row.reviewCount})</span>
                  </span>
                </Td>
                <Td className="hidden xl:table-cell">
                  <span
                    className={
                      row.portionsLeft === 0 ? "text-[13px] font-semibold text-[#a4412c]" : "text-[13px]"
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

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UtensilsCrossed className="mx-auto size-7 text-muted-soft" />
            <p className="mt-3 text-[15.5px] font-semibold text-charcoal">{t("noResults")}</p>
            <p className="mt-1 text-[13.5px] text-muted">{t("noResultsFilters")}</p>
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
        description={selected ? `${selected.cook} · ${selected.cuisine}` : undefined}
        className="md:max-w-lg"
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === selected.id
                        ? { ...row, status: row.status === "live" ? "paused" : "live" }
                        : row,
                    ),
                  );
                  toast(
                    selected.status === "live" ? t("dishHiddenToast") : t("dishRestoredToast"),
                  );
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

            <p className="text-[14px] leading-relaxed text-muted">{selected.desc}</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("ratingCol"), value: selected.rating.toFixed(1) },
                { label: t("reviews"), value: selected.reviewCount },
                { label: t("portionsLeft"), value: selected.portionsLeft },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line bg-white p-3 text-center">
                  <p className="text-[18px] font-semibold leading-none text-charcoal">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-soft">{stat.label}</p>
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
                  {selected.reported ? t("flaggedReviews") : t("awaitingReview")}
                </span>
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-muted-soft">{t("adminDishNote")}</p>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(hideTarget)}
        onClose={() => setHideId(null)}
        onConfirm={() => {
          if (hideTarget) {
            setRows((prev) =>
              prev.map((row) =>
                row.id === hideTarget.id ? { ...row, status: "paused" } : row,
              ),
            );
            toast(t("dishHiddenToast"), { description: hideTarget.name, variant: "info" });
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
