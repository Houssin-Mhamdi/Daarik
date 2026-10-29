"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChefHat,
  Eye,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, EmptyState, Sheet } from "@/components/ui/overlays";
import { FilterChip, Card } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import { dishesByCook, loc, type Dish } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

type Status = "live" | "paused" | "draft";
type Filter = "all" | "live" | "paused" | "draft";

const statusFor = (dish: Dish, index: number): Status =>
  dish.id === "brik" ? "paused" : dish.id === "tajine-veg" ? "draft" : "live";

export default function CookDishesPage() {
  const { t, lang, toast } = useApp();
  const seed = useMemo(() => dishesByCook("rana"), []);
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(seed.map((dish, index) => [dish.id, statusFor(dish, index)])),
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [menuDish, setMenuDish] = useState<Dish | null>(null);
  const [deleteDish, setDeleteDish] = useState<Dish | null>(null);

  const dishes = useMemo(
    () => dishesByCook("rana").filter((dish) => Boolean(statuses[dish.id])),
    [statuses],
  );

  const filtered = dishes.filter((dish) => {
    const status = statuses[dish.id];
    if (filter !== "all" && status !== filter) return false;
    if (!query.trim()) return true;
    return loc(dish.name, lang).toLowerCase().includes(query.toLowerCase());
  });

  const counts = {
    all: dishes.length,
    live: dishes.filter((dish) => statuses[dish.id] === "live").length,
    paused: dishes.filter((dish) => statuses[dish.id] === "paused").length,
    draft: dishes.filter((dish) => statuses[dish.id] === "draft").length,
  };

  function setStatus(dish: Dish, status: Status) {
    setStatuses((prev) => ({ ...prev, [dish.id]: status }));
    setMenuDish(null);
  }

  return (
    <div className="pb-8 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1180px] md:px-8 md:pt-10">
        <CookMobileHeader
          title={t("myDishes")}
          subtitle={t("myDishesSub")}
          action={
            <Link
              href="/cook/dishes/new"
              className="flex h-10 items-center gap-1 rounded-full bg-terracotta px-3.5 text-[13px] font-semibold text-white"
            >
              <Plus className="size-3.5" />
              {t("addDish")}
            </Link>
          }
        />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("myDishes")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">{t("myDishesSub")}</p>
          </div>
          <Link href="/cook/dishes/new">
            <Button size="sm">
              <Plus className="size-4" />
              {t("addNewDish")}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 md:mt-5">
          {(
            [
              ["all", t("allDishes"), counts.all],
              ["live", t("liveDishes"), counts.live],
              ["paused", t("pausedDishes"), counts.paused],
              ["draft", t("drafts"), counts.draft],
            ] as const
          ).map(([id, label, count]) => (
            <FilterChip
              key={id}
              active={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11.5px]",
                  filter === id ? "bg-white/20" : "bg-cream-100 text-muted",
                )}
              >
                {count}
              </span>
            </FilterChip>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 md:max-w-sm">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchDishes")}
              className="h-10 rounded-full border-line bg-white ps-10 text-[14.5px]"
              aria-label={t("searchDishes")}
            />
          </div>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-muted md:hidden"
            aria-label={t("filters")}
          >
            <CalendarDays className="size-4" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="mt-4 bg-white/60"
            icon={<UtensilsCrossed className="size-7" />}
            title={t("noDishesTitle")}
            description={t("noDishesSub")}
            action={
              <Link href="/cook/dishes/new">
                <Button size="sm">{t("createFirstDish")}</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="mt-3 space-y-3 md:hidden">
              {filtered.map((dish) => {
                const status = statuses[dish.id];
                const sold = dish.portions - dish.portionsLeft;
                const percent = Math.round((sold / dish.portions) * 100);
                return (
                  <article
                    key={dish.id}
                    className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card"
                  >
                    <div className="flex gap-3 p-3">
                      <Link
                        href={`/cook/dishes/${dish.id}/edit`}
                        className="size-[84px] shrink-0 overflow-hidden rounded-2xl"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dish.image}
                          alt={loc(dish.name, lang)}
                          className="size-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/cook/dishes/${dish.id}/edit`}
                              className="line-clamp-1 text-[15px] font-semibold text-charcoal"
                            >
                              {loc(dish.name, lang)}
                            </Link>
                            <p className="mt-0.5 text-[12.5px] text-muted">
                              {formatPrice(dish.price, lang)} · {t("priceEach")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMenuDish(dish)}
                            aria-label={t("more")}
                            className="-me-1 grid size-8 shrink-0 place-items-center rounded-full text-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {dish.portionsLeft === 0 ? (
                            <Badge variant="destructive" size="sm">
                              {t("soldOutBadge")}
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                status === "live"
                                  ? "olive"
                                  : status === "paused"
                                    ? "saffron"
                                    : "outline"
                              }
                              size="sm"
                            >
                              {status === "live"
                                ? t("live")
                                : status === "paused"
                                  ? t("paused")
                                  : t("draft")}
                            </Badge>
                          )}
                          <span className="text-[11.5px] text-muted">
                            {t("soldThisWeek", { count: sold })}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              {t("portionsSold", {
                                sold,
                                total: dish.portions,
                              })}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-100">
                            <div
                              className="h-full rounded-full bg-olive"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-line/70 bg-cream/40 px-3 py-2">
                      <Link
                        href={`/cook/dishes/${dish.id}/edit`}
                        className="flex h-8 items-center gap-1 rounded-full px-2 text-[12.5px] font-semibold text-charcoal"
                      >
                        <Pencil className="size-3" />
                        {t("edit")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const next = status === "live" ? "paused" : "live";
                          setStatus(dish, next);
                          toast(next === "live" ? t("dishResumed") : t("dishPaused"));
                        }}
                        className="flex h-8 items-center gap-1 rounded-full px-2 text-[12.5px] font-semibold text-muted"
                      >
                        {status === "live" ? (
                          <Pause className="size-3" />
                        ) : (
                          <Play className="size-3" />
                        )}
                        {status === "live" ? t("pauseDish") : t("resumeDish")}
                      </button>
                      <span className="ms-auto flex items-center gap-1 text-[11.5px] text-muted-soft">
                        <Eye className="size-3" />
                        214
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop table */}
            <Card className="mt-5 hidden overflow-hidden md:block">
              <table className="w-full text-start">
                <thead>
                  <tr className="border-b border-line bg-cream/50 text-[12px] uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-3 text-start font-semibold">{t("dishes")}</th>
                    <th className="px-3 py-3 text-start font-semibold">{t("status")}</th>
                    <th className="px-3 py-3 text-start font-semibold">{t("price")}</th>
                    <th className="px-3 py-3 text-start font-semibold">{t("portionsSold", { sold: "", total: "" }).replace(/\s*of\s*$/, "")}</th>
                    <th className="px-3 py-3 text-start font-semibold">{t("availabilityLabel")}</th>
                    <th className="px-5 py-3 text-end font-semibold">{t("edit")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filtered.map((dish) => {
                    const status = statuses[dish.id];
                    const sold = dish.portions - dish.portionsLeft;
                    const percent = Math.round((sold / dish.portions) * 100);
                    return (
                      <tr key={dish.id} className="group transition hover:bg-cream/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={dish.image}
                              alt={loc(dish.name, lang)}
                              className="size-11 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/cook/dishes/${dish.id}/edit`}
                                className="block max-w-[260px] truncate text-[14.5px] font-semibold text-charcoal"
                              >
                                {loc(dish.name, lang)}
                              </Link>
                              <p className="mt-0.5 text-[12px] text-muted">
                                {dish.serves} {t("people")} · {loc(dish.prepTime, lang)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={
                              status === "live"
                                ? "olive"
                                : status === "paused"
                                  ? "saffron"
                                  : "outline"
                            }
                            size="sm"
                          >
                            {status === "live"
                              ? t("live")
                              : status === "paused"
                                ? t("paused")
                                : t("draft")}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-[14px] font-medium text-charcoal">
                          {formatPrice(dish.price, lang)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-cream-100">
                              <div
                                className="h-full rounded-full bg-olive"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[12.5px] text-muted">
                              {sold}/{dish.portions}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[12.5px] text-muted">
                          {t("nextPickupLabel", { day: t("tomorrow") })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const next = status === "live" ? "paused" : "live";
                                setStatus(dish, next);
                                toast(
                                  next === "live" ? t("dishResumed") : t("dishPaused"),
                                );
                              }}
                              aria-label={
                                status === "live" ? t("pauseDish") : t("resumeDish")
                              }
                              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-cream hover:text-charcoal"
                            >
                              {status === "live" ? (
                                <Pause className="size-3.5" />
                              ) : (
                                <Play className="size-3.5" />
                              )}
                            </button>
                            <Link
                              href={`/cook/dishes/${dish.id}/edit`}
                              aria-label={t("editDish")}
                              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-cream hover:text-charcoal"
                            >
                              <Pencil className="size-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteDish(dish)}
                              aria-label={t("deleteDish")}
                              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-[#fdf1ec] hover:text-[#a13a28]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}

        <p className="mt-4 flex items-start gap-1.5 px-1 text-[12px] leading-relaxed text-muted">
          <ChefHat className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
          {t("manageDishesNote")}
        </p>
      </div>

      <Sheet
        open={Boolean(menuDish)}
        onClose={() => setMenuDish(null)}
        title={menuDish ? loc(menuDish.name, lang) : ""}
        description={t("manageDishesNote")}
      >
        {menuDish ? (
          <div className="space-y-2">
            <Link
              href={`/cook/dishes/${menuDish.id}/edit`}
              className="flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 text-[14.5px] font-semibold text-charcoal"
            >
              <Pencil className="size-4 text-terracotta" />
              {t("editDish")}
            </Link>
            <button
              type="button"
              onClick={() => {
                const next = statuses[menuDish.id] === "live" ? "paused" : "live";
                setStatus(menuDish, next);
                toast(next === "live" ? t("dishResumed") : t("dishPaused"));
              }}
              className="flex h-12 w-full items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 text-[14.5px] font-semibold text-charcoal"
            >
              {statuses[menuDish.id] === "live" ? (
                <Pause className="size-4 text-saffron" />
              ) : (
                <Play className="size-4 text-olive" />
              )}
              {statuses[menuDish.id] === "live"
                ? t("pauseDish")
                : t("resumeDish")}
            </button>
            <Link
              href={`/dish/${menuDish.id}`}
              className="flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 text-[14.5px] font-semibold text-charcoal"
            >
              <Eye className="size-4 text-muted" />
              {t("viewDish")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuDish(null);
                setDeleteDish(menuDish);
              }}
              className="flex h-12 w-full items-center gap-2.5 rounded-2xl border border-[#f0d2c9] bg-[#fdf1ec] px-3.5 text-[14.5px] font-semibold text-[#a13a28]"
            >
              <Trash2 className="size-4" />
              {t("deleteDish")}
            </button>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteDish)}
        onClose={() => setDeleteDish(null)}
        onConfirm={() => {
          if (deleteDish) {
            setStatuses((prev) => {
              const next = { ...prev };
              delete next[deleteDish.id];
              return next;
            });
            toast(t("dishDeleted"));
          }
          setDeleteDish(null);
        }}
        title={t("deleteDishTitle")}
        description={t("deleteDishDesc")}
        confirmLabel={t("deleteDish")}
        cancelLabel={t("cancel")}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
