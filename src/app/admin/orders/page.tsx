"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  MapPin,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  Timer,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, SegmentedTabs } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  MoneyText,
  StatusPill,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { adminKpis, adminOrders } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

type AdminOrder = (typeof adminOrders)[number];

const extraOrders: AdminOrder[] = [
  {
    code: "DR-2414",
    customer: "Nadia Rahmani",
    cook: "Fatima Haddad",
    amount: 41.5,
    status: "preparing" as const,
    pickup: "31 Oct · 13:00",
    placed: "38 min ago",
  },
  {
    code: "DR-2412",
    customer: "Jeroen Visser",
    cook: "Omar Benali",
    amount: 22,
    status: "confirmed" as const,
    pickup: "31 Oct · 12:30",
    placed: "52 min ago",
  },
  {
    code: "DR-2411",
    customer: "Meryem Aydin",
    cook: "Samira Khoury",
    amount: 56.5,
    status: "ready" as const,
    pickup: "30 Oct · 19:00",
    placed: "1 hr ago",
  },
  {
    code: "DR-2409",
    customer: "Daan Smit",
    cook: "Rana El Amri",
    amount: 18,
    status: "completed" as const,
    pickup: "30 Oct · 17:30",
    placed: "2 hrs ago",
  },
  {
    code: "DR-2407",
    customer: "Layla Mansouri",
    cook: "Fatima Haddad",
    amount: 30.5,
    status: "completed" as const,
    pickup: "30 Oct · 13:30",
    placed: "3 hrs ago",
  },
  {
    code: "DR-2404",
    customer: "Ruben de Boer",
    cook: "Omar Benali",
    amount: 26,
    status: "cancelled" as const,
    pickup: "30 Oct · 12:00",
    placed: "4 hrs ago",
  },
  {
    code: "DR-2401",
    customer: "Ines Bouazizi",
    cook: "Rana El Amri",
    amount: 47.5,
    status: "completed" as const,
    pickup: "29 Oct · 18:30",
    placed: "Yesterday",
  },
];

const allOrders: AdminOrder[] = [...adminOrders, ...extraOrders];

type Filter = "all" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
type OrderStatus = AdminOrder["status"];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

const statusLabelKey: Record<OrderStatus, string> = {
  confirmed: "statusConfirmed",
  preparing: "statusPreparing",
  ready: "statusReady",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

export default function AdminOrdersPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>(allOrders);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("q");
    if (incoming) setQuery(incoming);
  }, []);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: orders.length,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      base[order.status] += 1;
    });
    return base;
  }, [orders]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || order.status === filter;
      const matchesQuery =
        !text ||
        order.code.toLowerCase().includes(text) ||
        order.customer.toLowerCase().includes(text) ||
        order.cook.toLowerCase().includes(text);
      return matchesFilter && matchesQuery;
    });
  }, [filter, orders, query]);

  const selected = orders.find((order) => order.code === selectedCode) ?? null;
  const cancelTarget = orders.find((order) => order.code === cancelCode) ?? null;

  const updateStatus = (code: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.code === code ? { ...order, status } : order)),
    );
    toast(t("orderStatusUpdated"), {
      description: `${code} · ${t(statusLabelKey[status])}`,
    });
  };

  const exportCsv = () => {
    const rows = [
      ["Order", "Customer", "Cook", "Amount", "Status", "Pickup"],
      ...orders.map((order) => [
        order.code,
        order.customer,
        order.cook,
        String(order.amount),
        order.status,
        order.pickup,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "darna-orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast(t("exportReady"));
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("marketplace")}
        title={t("adminNavOrders")}
        subtitle={t("adminOrdersSub")}
        actions={
          <>
            <Link
              href="/admin/disputes"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong sm:flex"
            >
              <ReceiptText className="size-3.5 text-muted" />
              {t("openDisputes")} ({adminKpis.disputes})
            </Link>
            <Button variant="secondary" size="sm" className="h-9" onClick={exportCsv}>
              <Download className="size-4" />
              {t("exportCsv")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: t("ordersToday"),
            value: adminKpis.ordersToday,
            icon: ShoppingBag,
            tone: "bg-terracotta-50 text-terracotta-700",
          },
          {
            label: t("statusPreparing"),
            value: orders.filter((order) => order.status === "preparing").length,
            icon: Timer,
            tone: "bg-saffron-50 text-[#8a5d13]",
          },
          {
            label: t("readyForPickup"),
            value: orders.filter((order) => order.status === "ready").length,
            icon: Package,
            tone: "bg-olive-50 text-olive",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <AdminCard key={stat.label} className="flex items-center gap-3 p-3 md:p-4">
              <span className={cn("hidden size-9 place-items-center rounded-xl sm:grid", stat.tone)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
                  {stat.label}
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-charcoal">
                  {stat.value}
                </p>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard className="mt-4">
        <div className="flex flex-col gap-3 border-b border-[#f0e9dc] p-3 md:flex-row md:items-center md:p-4">
          <div className="relative min-w-0 flex-1 md:max-w-[320px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchAdmin")}
              aria-label={t("searchAdmin")}
              className="h-9 w-full rounded-xl border border-line bg-cream/50 ps-9 pe-8 text-[14px] text-charcoal outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
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
          <div className="min-w-0 overflow-x-auto no-scrollbar md:ms-auto">
            <SegmentedTabs
              scrollable
              value={filter}
              onChange={(value) => setFilter(value)}
              tabs={[
                { value: "all", label: t("all"), count: counts.all },
                { value: "confirmed", label: t("statusConfirmed"), count: counts.confirmed },
                { value: "preparing", label: t("statusPreparing"), count: counts.preparing },
                { value: "ready", label: t("statusReady"), count: counts.ready },
                { value: "completed", label: t("completed"), count: counts.completed },
                { value: "cancelled", label: t("cancelled"), count: counts.cancelled },
              ]}
              className="min-w-max"
            />
          </div>
        </div>

        <AdminTable>
          <thead>
            <tr>
              <Th>{t("orderId")}</Th>
              <Th>{t("customerCol")}</Th>
              <Th className="hidden lg:table-cell">{t("cookCol")}</Th>
              <Th className="hidden md:table-cell">{t("pickupCol")}</Th>
              <Th className="hidden xl:table-cell">{t("placedCol")}</Th>
              <Th>{t("amountCol")}</Th>
              <Th>{t("statusCol")}</Th>
              <Th className="text-end">{t("actionCol")}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.code}
                className="group cursor-pointer transition hover:bg-cream/40"
                onClick={() => setSelectedCode(order.code)}
              >
                <Td className="font-semibold">{order.code}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[11px] font-bold">
                      {order.customer
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="truncate">{order.customer}</span>
                  </div>
                </Td>
                <Td className="hidden text-muted lg:table-cell">{order.cook}</Td>
                <Td className="hidden whitespace-nowrap text-muted md:table-cell">{order.pickup}</Td>
                <Td className="hidden text-muted xl:table-cell">{order.placed}</Td>
                <Td>
                  <MoneyText value={order.amount} className="text-[14px]" />
                </Td>
                <Td>
                  <StatusPill status={order.status} />
                </Td>
                <Td className="text-end">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg text-muted-soft transition group-hover:bg-white group-hover:text-charcoal">
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-cream-100 text-muted">
              <Search className="size-5" />
            </span>
            <p className="mt-3 text-[16px] font-semibold text-charcoal">{t("noResults")}</p>
            <p className="mt-1 max-w-xs text-[13.5px] text-muted">{t("noResultsFilters")}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              {t("clearFiltersShort")}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-2 px-4 py-3 text-[13px] text-muted sm:flex-row md:px-5">
          <span>
            {t("showingResults", { shown: filtered.length, total: orders.length })}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              aria-label={t("previousPage")}
              className="grid size-8 place-items-center rounded-lg border border-line bg-white text-charcoal disabled:opacity-40"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </button>
            <span className="grid size-8 place-items-center rounded-lg bg-charcoal text-[13px] font-semibold text-cream">
              1
            </span>
            <button
              type="button"
              aria-label={t("nextPage")}
              onClick={() => toast(t("allOrdersLoaded"), { variant: "info" })}
              className="grid size-8 place-items-center rounded-lg border border-line bg-white text-charcoal transition hover:bg-cream-50"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </AdminCard>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedCode(null)}
        title={selected ? `${t("orderDetails")} · ${selected.code}` : t("orderDetails")}
        description={selected ? `${selected.placed} · ${selected.pickup}` : undefined}
        className="md:max-w-lg"
        footer={
          selected ? (
            <div className="flex gap-2">
              {nextStatus[selected.status] ? (
                <Button
                  className="flex-1"
                  onClick={() => updateStatus(selected.code, nextStatus[selected.status] as OrderStatus)}
                >
                  {t("markAs")} {t(statusLabelKey[nextStatus[selected.status] as OrderStatus])}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCode(null);
                    toast(t("noFurtherActions"), { variant: "info" });
                  }}
                >
                  {t("close")}
                </Button>
              )}
              {selected.status !== "completed" && selected.status !== "cancelled" ? (
                <Button variant="destructive" onClick={() => setCancelCode(selected.code)}>
                  {t("cancelOrder")}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                    {t("orderStatusDemo")}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusPill status={selected.status} />
                    <span className="text-[13px] text-muted">{selected.placed}</span>
                  </div>
                </div>
                <MoneyText value={selected.amount} className="text-[20px]" />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {(["confirmed", "preparing", "ready", "completed"] as const).map(
                  (status, index) => {
                    const order = ["confirmed", "preparing", "ready", "completed"];
                    const currentIndex = order.indexOf(selected.status);
                    const done = selected.status !== "cancelled" && index <= currentIndex;
                    return (
                      <div key={status} className="flex flex-1 items-center gap-1.5">
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                            done ? "bg-olive text-white" : "bg-cream-200 text-muted-soft",
                          )}
                        >
                          {index + 1}
                        </span>
                        {index < 3 ? (
                          <span
                            className={cn(
                              "h-0.5 flex-1 rounded-full",
                              index < currentIndex ? "bg-olive" : "bg-cream-200",
                            )}
                          />
                        ) : null}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("customerCol")}
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-charcoal">
                  {selected.customer}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted">+31 6 ···· ····</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("cookCol")}
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-charcoal">{selected.cook}</p>
                <Link
                  href="/admin/cooks"
                  className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-terracotta hover:underline"
                >
                  {t("viewPublicPage")}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-charcoal">
                  <UtensilsCrossed className="size-3.5" />
                  {t("yourOrder")}
                </p>
                <span className="text-[12.5px] text-muted">2 {t("items")}</span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-[13.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Couscous Royal × 1</span>
                  <span className="font-medium tabular-nums">€14.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Brik à l&apos;œuf × 2</span>
                  <span className="font-medium tabular-nums">€11.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t("serviceFee")}</span>
                  <span className="font-medium tabular-nums">€1.50</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-1.5 text-[14.5px] font-semibold text-charcoal">
                  <span>{t("total")}</span>
                  <span>{formatPrice(selected.amount, lang)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl border border-line bg-white p-4 text-[13.5px]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Clock3 className="size-3.5" />
                  {t("pickupWindow")}
                </span>
                <span className="font-medium text-charcoal">{selected.pickup}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <MapPin className="size-3.5" />
                  {t("pickupArea")}
                </span>
                <span className="font-medium text-charcoal">Delfshaven, Rotterdam</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <User className="size-3.5" />
                  {t("payment")}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-charcoal">
                  iDEAL
                  <Badge variant="success">{t("paid")}</Badge>
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelCode(null)}
        onConfirm={() => {
          if (cancelTarget) updateStatus(cancelTarget.code, "cancelled");
          setCancelCode(null);
          setSelectedCode(null);
        }}
        title={t("cancelOrderTitle")}
        description={t("cancelOrderAdminDesc")}
        confirmLabel={t("cancelOrder")}
        cancelLabel={t("keepOrder")}
        variant="destructive"
      />
    </div>
  );
}
