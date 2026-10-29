"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChefHat,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Plus,
  Power,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/controls";
import { Card, Money } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import {
  cookEarnings,
  cookOrders,
  dishesByCook,
  loc,
  cookUser,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const series = cookEarnings.salesSeries;
const max = Math.max(...series);

export default function CookDashboardPage() {
  const { t, lang, toast } = useApp();
  const [open, setOpen] = useState(true);

  const incoming = cookOrders.filter((order) => order.status === "incoming");
  const preparing = cookOrders.filter((order) => order.status === "preparing");
  const myDishes = dishesByCook("rana");
  const pickups = cookOrders
    .filter((order) => order.status !== "completed")
    .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));

  const kpis = [
    {
      label: t("todayOrders"),
      value: "3",
      hint: t("ordersToConfirm", { count: incoming.length }),
      icon: ClipboardList,
      tone: "bg-terracotta-50 text-terracotta",
    },
    {
      label: t("upcomingPickups"),
      value: "4",
      hint: t("nextPickupLabel", { day: "18:00" }),
      icon: Clock3,
      tone: "bg-olive-50 text-olive-600",
    },
    {
      label: t("monthSales"),
      value: "€ 612",
      hint: t("commissionRate"),
      icon: TrendingUp,
      tone: "bg-saffron-50 text-[#8a5d13]",
    },
    {
      label: t("netEarnings"),
      value: "€ 520",
      hint: t("earningsNote"),
      icon: Wallet,
      tone: "bg-cream-100 text-charcoal",
    },
  ];

  return (
    <div className="pb-6 md:pb-12">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1240px] md:px-8 md:pt-10">
        <CookMobileHeader
          title={t("goodMorningCook", { name: cookUser.name.split(" ")[0] })}
          subtitle={t("todayOverview")}
          action={
            <Link
              href="/cook/profile"
              className="grid size-10 place-items-center rounded-full border border-line bg-white"
              aria-label={t("profile")}
            >
              <span className="flex flex-col gap-0.5">
                <span className="h-0.5 w-4 rounded-full bg-charcoal" />
                <span className="h-0.5 w-4 rounded-full bg-charcoal" />
                <span className="h-0.5 w-2.5 rounded-full bg-charcoal" />
              </span>
            </Link>
          }
        />

        <div className="mb-4 hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookDashboard")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("goodMorningCook", { name: cookUser.name.split(" ")[0] })}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">
              {t("dashboardNote")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cook/dishes/new">
              <Button variant="outline" size="sm">
                <Plus className="size-3.5" />
                {t("addDish")}
              </Button>
            </Link>
            <Link href="/cook/orders">
              <Button size="sm">
                {t("manageOrders")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Kitchen status */}
        <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-white p-3.5 shadow-card md:mt-5">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-2xl",
              open ? "bg-olive-50 text-olive-600" : "bg-cream-100 text-muted",
            )}
          >
            <Power className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-charcoal">
              {open ? t("kitchenOpen") : t("kitchenClosed")}
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  open ? "bg-olive" : "bg-muted-soft",
                )}
              />
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {open ? t("kitchenOpenDesc") : t("kitchenClosedDesc")}
            </p>
          </div>
          <Switch
            checked={open}
            onCheckedChange={(value) => {
              setOpen(value);
              toast(value ? t("kitchenOpen") : t("kitchenClosed"), {
                variant: value ? "success" : "info",
              });
            }}
            label={t("kitchenStatus")}
          />
        </div>

        {/* KPIs */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:mt-4 md:grid-cols-4 md:gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-[20px] border border-line bg-white p-3.5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className={cn("grid size-8 place-items-center rounded-xl", kpi.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-soft" />
                </div>
                <p className="mt-2.5 text-[21px] font-semibold leading-none text-charcoal md:text-[28px]">
                  {kpi.value}
                </p>
                <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted md:text-[12.5px]">
                  {kpi.label}
                </p>
                <p className="mt-1 line-clamp-1 text-[11.5px] text-muted-soft">
                  {kpi.hint}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:mt-5 md:grid-cols-[1.35fr_0.65fr] md:items-start">
          <div className="space-y-4">
            {/* Needs action */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("needsAction")}
                  </h2>
                  <Badge variant="terracotta" size="sm">
                    {incoming.length + preparing.length}
                  </Badge>
                </div>
                <Link
                  href="/cook/orders"
                  className="text-[12.5px] font-semibold text-terracotta"
                >
                  {t("viewAllOrders")}
                </Link>
              </div>
              <div className="divide-y divide-line/60">
                {[...incoming.slice(0, 2), ...preparing.slice(0, 1)].map((order) => (
                  <div key={order.id} className="flex items-center gap-3 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream-100 text-[12.5px] font-bold text-charcoal">
                      {order.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href="/cook/orders"
                        className="block truncate text-[14px] font-semibold text-charcoal"
                      >
                        {order.customer}
                      </Link>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {order.code} · {order.items.reduce((n, i) => n + i.qty, 0)}{" "}
                        {t("portions").toLowerCase()} · {order.pickupTime}
                      </p>
                    </div>
                    {order.status === "incoming" ? (
                      <button
                        type="button"
                        onClick={() => toast(t("orderAccepted"))}
                        className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-terracotta px-3 text-[12px] font-semibold text-white"
                      >
                        <Check className="size-3" />
                        {t("accept")}
                      </button>
                    ) : (
                      <Badge variant="saffron" size="sm">
                        {t("beingPrepared")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Sales chart */}
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("weeklySales")}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {t("thisWeek")}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-[19px] font-semibold text-charcoal">
                    <Money value={cookEarnings.gross} />
                  </p>
                  <p className="text-[11.5px] text-olive-600">+12.4%</p>
                </div>
              </div>
              <div className="mt-4 flex h-28 items-end gap-2 md:h-36">
                {series.map((value, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end rounded-t-md bg-cream-100">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          index === series.length - 1
                            ? "bg-terracotta"
                            : "bg-terracotta/35",
                        )}
                        style={{
                          height: `${Math.max(12, (value / max) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-soft">
                      {t("weekDays").split(",")[index]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Today's pickups */}
            <Card className="overflow-hidden md:hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <h2 className="text-[16px] font-semibold text-charcoal">
                  {t("todaysPickups")}
                </h2>
                <span className="text-[12.5px] text-muted">4 {t("orders")}</span>
              </div>
              <div className="divide-y divide-line/60">
                {pickups.slice(0, 3).map((order) => (
                  <Link
                    key={order.id}
                    href="/cook/orders"
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="w-10 shrink-0 text-[13.5px] font-bold text-charcoal">
                      {order.pickupTime}
                    </span>
                    <span className="h-8 w-0.5 rounded-full bg-terracotta/30" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-charcoal">
                        {order.customer}
                      </p>
                      <p className="text-[11.5px] text-muted">
                        {order.code} ·{" "}
                        {order.items.reduce((n, i) => n + i.qty, 0)} items
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-soft rtl:rotate-180" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Next payout */}
            <div className="overflow-hidden rounded-[22px] bg-charcoal p-4 text-cream shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-saffron">
                  {t("nextPayoutLabel")}
                </p>
                <Wallet className="size-4 text-saffron" />
              </div>
              <p className="mt-2 font-display text-[30px] font-semibold leading-none text-white">
                <Money value={cookEarnings.pending} />
              </p>
              <p className="mt-1 text-[12.5px] text-cream/55">
                {loc(cookEarnings.nextPayoutDate, lang)} · {t("payoutScheduleDesc")}
              </p>
              <Link
                href="/cook/earnings"
                className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/10 text-[13px] font-semibold text-cream transition hover:bg-white/15"
              >
                {t("viewEarnings")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>

            {/* Quick actions */}
            <Card className="p-4">
              <h2 className="text-[15px] font-semibold text-charcoal">
                {t("quickActions")}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { href: "/cook/dishes/new", key: "addDish", icon: Plus },
                  { href: "/cook/orders", key: "manageOrders", icon: ClipboardList },
                  { href: "/cook/availability", key: "updateAvailability", icon: CalendarDays },
                  { href: "/cook/earnings", key: "earningsTitle", icon: Wallet },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.key}
                      href={action.href}
                      className="flex flex-col gap-2 rounded-2xl border border-line bg-cream/30 p-3 transition hover:border-line-strong hover:bg-cream"
                    >
                      <span className="grid size-8 place-items-center rounded-xl bg-white text-terracotta shadow-sm">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-[12.5px] font-semibold leading-tight text-charcoal">
                        {t(action.key)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Card>

            {/* Menu summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-charcoal">
                  {t("myDishes")}
                </h2>
                <Link
                  href="/cook/dishes"
                  className="text-[12px] font-semibold text-terracotta"
                >
                  {t("viewAll")}
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {myDishes.slice(0, 3).map((dish) => (
                  <div key={dish.id} className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.image}
                      alt={loc(dish.name, lang)}
                      className="size-9 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-charcoal">
                        {loc(dish.name, lang)}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {dish.portionsLeft} {t("portionsLeft")}
                      </p>
                    </div>
                    <ChefHat className="size-3.5 text-muted-soft" />
                  </div>
                ))}
              </div>
              <Link
                href="/cook/dishes"
                className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong text-[12.5px] font-semibold text-terracotta"
              >
                <UtensilsCrossed className="size-3.5" />
                {t("addNewDish")}
              </Link>
            </Card>
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-muted-soft">
          {t("dashboardNote")} · {t("demoNotice")}
        </p>
      </div>
    </div>
  );
}
