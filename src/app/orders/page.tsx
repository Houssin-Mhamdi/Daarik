"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  ReceiptText,
  RotateCcw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/overlays";
import { PageHeader } from "@/components/ui/misc";
import { SegmentedTabs } from "@/components/ui/controls";
import { OrderStatusBadge } from "@/components/app/order-status";
import { useApp } from "@/components/providers/app-provider";
import {
  getCook,
  getDish,
  loc,
  orderSubtotal,
  pickupOptions,
  type CustomerOrder,
} from "@/lib/data";
import { useMyOrdersQuery } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

type Tab = "upcoming" | "completed" | "cancelled";

const tabFor = (order: CustomerOrder): Tab =>
  order.status === "cancelled"
    ? "cancelled"
    : order.status === "completed"
      ? "completed"
      : "upcoming";

export default function OrdersPage() {
  const { t, lang, serviceFee } = useApp();
  const { data: myOrders = [] } = useMyOrdersQuery();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");

  const groups = useMemo(
    () => ({
      upcoming: myOrders.filter((order) => tabFor(order) === "upcoming"),
      completed: myOrders.filter((order) => tabFor(order) === "completed"),
      cancelled: myOrders.filter((order) => tabFor(order) === "cancelled"),
    }),
    [myOrders],
  );

  const orders = groups[tab];

  const emptyCopy = {
    upcoming: { title: t("noUpcoming"), sub: t("noUpcoming") },
    completed: { title: t("noOrders"), sub: t("noCompleted") },
    cancelled: { title: t("noOrders"), sub: t("noCancelled") },
  }[tab];

  return (
    <div className="pb-8 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1080px] md:px-8 md:pt-10">
        <PageHeader
          title={t("myOrders")}
          subtitle={t("myOrdersSub")}
          eyebrow={t("orders")}
          className="-mx-4"
        />

        <div className="md:grid md:grid-cols-[212px_1fr] md:gap-8">
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-1.5">
              <div className="rounded-2xl border border-line bg-white p-2 shadow-card">
                {(
                  [
                    ["upcoming", t("upcoming"), groups.upcoming.length],
                    ["completed", t("completed"), groups.completed.length],
                    ["cancelled", t("cancelled"), groups.cancelled.length],
                  ] as const
                ).map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-[14.5px] font-semibold transition",
                      tab === id
                        ? "bg-terracotta text-white shadow-[0_8px_20px_-14px_rgba(198,93,58,0.9)]"
                        : "text-muted hover:bg-cream hover:text-charcoal",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[12px]",
                        tab === id
                          ? "bg-white/20 text-white"
                          : "bg-cream-100 text-muted",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-card">
                <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-terracotta">
                  <ReceiptText className="size-4" />
                </span>
                <p className="mt-2.5 text-[14.5px] font-semibold text-charcoal">
                  {t("needHelp")}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {t("orderHelp")}
                </p>
                <Link
                  href="/help"
                  className="mt-2.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-terracotta"
                >
                  {t("helpCenter")}
                  <ArrowRight className="size-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="md:hidden">
              <SegmentedTabs
                value={tab}
                onChange={(value) => setTab(value as Tab)}
                tabs={[
                  { value: "upcoming", label: t("upcoming") },
                  { value: "completed", label: t("completed") },
                  { value: "cancelled", label: t("cancelled") },
                ]}
              />
            </div>

            <div className="mt-3 flex items-center justify-between md:mt-0">
              <p className="text-[13.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                <span className="md:hidden">
                  {tab === "upcoming"
                    ? t("upcoming")
                    : tab === "completed"
                      ? t("completed")
                      : t("cancelled")}
                </span>
                <span className="hidden md:inline">
                  {orders.length}{" "}
                  {orders.length === 1 ? t("item") : t("items")}
                </span>
              </p>
              <button
                type="button"
                onClick={() => router.push("/explore")}
                className="flex h-8 items-center gap-1 rounded-full px-2 text-[13.5px] font-semibold text-terracotta hover:bg-terracotta-50"
              >
                {t("startExploring")}
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </button>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                className="mt-4 bg-white/60"
                icon={<Package className="size-7" />}
                title={emptyCopy.title}
                description={emptyCopy.sub}
                action={
                  <Button
                    size="sm"
                    className="h-10"
                    onClick={() => router.push("/explore")}
                  >
                    {t("startExploring")}
                  </Button>
                }
              />
            ) : (
              <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} tab={tab} />
                ))}
              </div>
            )}

            {orders.length ? (
              <div className="mt-5 rounded-2xl bg-cream-100/70 p-4 md:mt-6">
                <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  {t("pickupNote")}
                </p>
              </div>
            ) : null}

            <p className="mt-5 text-center text-[12.5px] text-muted-soft">
              {t("demoNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, tab }: { order: CustomerOrder; tab: Tab }) {
  const { t, lang, toast, serviceFee } = useApp();
  const cook = getCook(order.cookId);
  const pickup = pickupOptions.find((option) => option.id === order.pickup);
  const lines = order.items
    .map((item) => ({ item, dish: getDish(item.dishId) }))
    .filter((line) => line.dish);
  const total = orderSubtotal(order.items) + serviceFee;
  const firstDish = lines[0]?.dish;

  return (
    <article className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card transition hover:shadow-lift">
      <Link href={`/orders/${order.id}`} className="block">
        <div className="flex items-center gap-2 border-b border-line/70 px-3.5 py-2.5">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
            {t("orderRef")} {order.code}
          </span>
          <span className="size-1 rounded-full bg-line-strong" />
          <span className="text-[12.5px] text-muted">
            {loc(order.placed, lang)}
          </span>
          <span className="ms-auto">
            <OrderStatusBadge status={order.status} />
          </span>
        </div>

        <div className="p-3.5">
          <div className="flex gap-3">
            <div className="relative size-[62px] shrink-0">
              {firstDish ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstDish.image}
                    alt={loc(firstDish.name, lang)}
                    className="size-full rounded-2xl object-cover"
                  />
                  {lines.length > 1 ? (
                    <span className="absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-white bg-charcoal text-[11px] font-bold text-white">
                      +{lines.length - 1}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[15px] font-semibold text-charcoal">
                {lines
                  .map((line) => loc(line.dish!.name, lang))
                  .join(" · ")}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {t("from")} {cook?.name.split(" ")[0]} ·{" "}
                {order.items.reduce((n, item) => n + item.qty, 0)}{" "}
                {order.items.length === 1 ? t("item") : t("items")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                <span className="flex items-center gap-1 font-medium text-charcoal">
                  <CalendarClock className="size-3 text-terracotta" />
                  {pickup ? loc(pickup.shortDay, lang) : ""}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <Clock3 className="size-3" />
                  {order.pickupTime}
                </span>
                <span className="flex items-center gap-1 font-semibold text-charcoal">
                  {formatPrice(total, lang)}
                </span>
              </div>
            </div>
          </div>

          {tab === "upcoming" && order.status === "ready" ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-olive-50 px-3 py-2 text-[12.5px] font-medium text-olive-600">
              <span className="size-1.5 animate-pulse rounded-full bg-olive" />
              {t("readyForPickup")} · {order.pickupTime}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t border-line/70 bg-cream/40 px-3 py-2">
        {tab === "completed" ? (
          <>
            {!order.reviewed ? (
              <button
                type="button"
                onClick={() => toast(t("orderReviewedToast"))}
                className="flex h-8 items-center gap-1 rounded-full bg-terracotta px-3 text-[12.5px] font-semibold text-white"
              >
                <Star className="size-3" />
                {t("leaveReview")}
              </button>
            ) : (
              <span className="flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-[12.5px] font-medium text-olive-600">
                <Star className="size-3 fill-saffron text-saffron" />
                {t("reviews")}
              </span>
            )}
            <button
              type="button"
              onClick={() => toast(t("addedToCart"))}
              className="flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[12.5px] font-semibold text-charcoal"
            >
              <RotateCcw className="size-3" />
              {t("orderAgain")}
            </button>
          </>
        ) : (
          <Link
            href={`/orders/${order.id}`}
            className="flex h-8 items-center gap-1 px-1 text-[12.5px] font-semibold text-terracotta"
          >
            {t("orderDetails")}
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </Link>
        )}
        <span className="ms-auto text-[12px] text-muted-soft">
          {order.paid ? t("paid") : t("refunded")}
        </span>
      </div>
    </article>
  );
}
