"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Download,
  Package,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  Timer,
  User,
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
  MoneyText,
  StatusPill,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  useAdminOrdersPaginatedQuery,
  useAdminRefundOrderMutation,
  useAdminUpdateOrderStatusMutation,
  type AdminOrderRecord,
} from "@/lib/queries";
import { cn, errorMessage, formatPrice } from "@/lib/utils";

type Filter =
  | "all"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
type AdminOrder = AdminOrderRecord & { placed: string };
type OrderStatus = AdminOrderRecord["status"];

const PAGE_SIZE = 15;

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

/** Quote CSV cells and neutralise spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AdminOrdersPage() {
  const { t, lang, toast } = useApp();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [page, setPage] = useState(1);

  const { data: paginated, isPending, isError } = useAdminOrdersPaginatedQuery({
    status: filter === "all" ? undefined : filter,
    q: query.trim() || undefined,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const total = paginated?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filter, query]);

  const updateOrderStatusMutation = useAdminUpdateOrderStatusMutation();
  const refundOrder = useAdminRefundOrderMutation();

  const orders = useMemo<AdminOrder[]>(
    () =>
      (paginated?.items ?? []).map((order) => ({
        ...order,
        placed: order.createdAt
          ? new Date(order.createdAt).toLocaleString(lang)
          : "—",
      })),
    [paginated?.items, lang],
  );

  const serverCounts = paginated?.counts;
  const counts = useMemo<Record<Filter, number>>(() => {
    const local: Record<Filter, number> = {
      all: total,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      local[order.status] += 1;
    });
    return {
      all: serverCounts?.all ?? local.all,
      confirmed: serverCounts?.confirmed ?? local.confirmed,
      preparing: serverCounts?.preparing ?? local.preparing,
      ready: serverCounts?.ready ?? local.ready,
      completed: serverCounts?.completed ?? local.completed,
      cancelled: serverCounts?.cancelled ?? local.cancelled,
    };
  }, [orders, serverCounts, total]);

  const selected = orders.find((order) => order.code === selectedCode) ?? null;
  const cancelTarget = orders.find((order) => order.code === cancelCode) ?? null;

  const openOrder = (code: string) => {
    setSelectedCode(code);
    setRefundAmount("");
    setRefundReason("");
  };

  const updateStatus = async (code: string, status: OrderStatus) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        id: code,
        status: status.toUpperCase(),
      });
      toast(t("orderStatusUpdated"), {
        description: `${code} · ${t(statusLabelKey[status])}`,
      });
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const refundable = selected
    ? Math.max(
        0,
        selected.amount - (selected.refunded ?? selected.refunds?.length ?? 0),
      )
    : 0;
  const parsedRefund = Number(refundAmount);
  const refundValid =
    Boolean(selected) &&
    Number.isFinite(parsedRefund) &&
    parsedRefund > 0 &&
    parsedRefund <= refundable;

  const submitRefund = async () => {
    if (!selected || !refundValid) return;
    try {
      await refundOrder.mutateAsync({
        id: selected.id,
        amount: parsedRefund,
        reason: refundReason.trim() || undefined,
      });
      setRefundAmount("");
      setRefundReason("");
      toast(t("paymentRefunded"), {
        description: `${selected.code} · ${formatPrice(parsedRefund, lang)}`,
      });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  const exportCsv = () => {
    const header = ["Order", "Customer", "Cook", "Amount", "Status", "Pickup", "Payment"];
    const lines = orders.map((order) =>
      [
        order.code,
        order.customer,
        order.cook,
        order.amount,
        order.status,
        order.pickup,
        order.paymentStatus,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daarik-orders.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(t("exportReady"));
  };

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
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
              {t("openDisputes")}
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
            label: t("all"),
            value: counts.all,
            icon: ShoppingBag,
            tone: "bg-terracotta-50 text-terracotta-700",
          },
          {
            label: t("statusPreparing"),
            value: counts.preparing,
            icon: Timer,
            tone: "bg-saffron-50 text-[#8a5d13]",
          },
          {
            label: t("readyForPickup"),
            value: counts.ready,
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
                <p className="mt-1 text-[22px] font-semibold leading-none text-charcoal tabular-nums">
                  {stat.value.toLocaleString(lang)}
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
              onChange={setFilter}
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

        {isError ? (
          <div role="alert" className="px-5 py-8 text-center text-sm text-danger">
            {t("loadError")}
          </div>
        ) : isPending ? (
          <div className="px-5 py-8 text-center text-sm text-muted">{t("loading")}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-cream-100 text-muted">
              <Search className="size-5" />
            </span>
            <p className="mt-3 text-[16px] font-semibold text-charcoal">{t("noResults")}</p>
            <p className="mt-1 max-w-xs text-[13.5px] text-muted">{t("noResultsFilters")}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
              {t("clearFiltersShort")}
            </Button>
          </div>
        ) : (
          <AdminTable>
            <TableHeader>
              <TableRow>
                <Th>{t("orderId")}</Th>
                <Th>{t("customerCol")}</Th>
                <Th className="hidden lg:table-cell">{t("cookCol")}</Th>
                <Th className="hidden md:table-cell">{t("pickupCol")}</Th>
                <Th className="hidden xl:table-cell">{t("placedCol")}</Th>
                <Th>{t("amountCol")}</Th>
                <Th>{t("statusCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="group cursor-pointer"
                  onClick={() => openOrder(order.code)}
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
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">
                    {order.pickup}
                  </Td>
                  <Td className="hidden text-muted xl:table-cell">{order.placed}</Td>
                  <Td>
                    <MoneyText value={order.amount} className="text-[14px]" />
                  </Td>
                  <Td>
                    <StatusPill status={order.status} />
                  </Td>
                  <Td className="text-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openOrder(order.code);
                      }}
                      className="rounded-lg px-2 py-1 text-[13px] font-semibold text-terracotta transition hover:bg-terracotta-50"
                    >
                      {t("viewDetails")}
                    </button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </AdminTable>
        )}

        {totalPages > 1 ? (
          <Pagination page={page} totalPages={totalPages} onPage={setPage} className="m-4" />
        ) : null}

        <div className="px-4 py-3 text-[13px] text-muted md:px-5">
          {t("showingResults", { shown: orders.length, total: counts.all })}
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
            <div className="flex flex-wrap gap-2">
              {nextStatus[selected.status] ? (
                <Button
                  className="flex-1"
                  loading={updateOrderStatusMutation.isPending}
                  onClick={() =>
                    void updateStatus(
                      selected.code,
                      nextStatus[selected.status] as OrderStatus,
                    )
                  }
                >
                  {t("markAs")}{" "}
                  {t(statusLabelKey[nextStatus[selected.status] as OrderStatus])}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              ) : (
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedCode(null)}>
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
                    {t("statusCol")}
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
                    const order: string[] = ["confirmed", "preparing", "ready", "completed"];
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
                <p className="mt-0.5 break-words text-[12.5px] text-muted">
                  {selected.customerPhone || selected.customerEmail || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("cookCol")}
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-charcoal">
                  {selected.cook}
                </p>
                <Link
                  href={selected.cookId ? `/admin/cooks?q=${encodeURIComponent(selected.cook)}` : "/admin/cooks"}
                  className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-terracotta hover:underline"
                >
                  {t("viewDetails")}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-charcoal">
                  <UtensilsCrossed className="size-3.5" />
                  {t("yourOrder")}
                </p>
                <span className="text-[12.5px] text-muted">
                  {selected.items.length} {t("items")}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-[13.5px]">
                {selected.items.map((item, index) => (
                  <div
                    key={`${selected.id}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted">
                      {(typeof item.dish?.name === "string"
                        ? item.dish.name
                        : (item.dish?.name?.[lang] ?? item.dish?.name?.en)) ||
                        t("adminNavDishes")}{" "}
                      × {item.qty}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatPrice(item.unitPrice * item.qty, lang)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t("serviceFee")}</span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(selected.serviceFee, lang)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-1.5 text-[14.5px] font-semibold text-charcoal">
                  <span>{t("total")}</span>
                  <span>{formatPrice(selected.amount, lang)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("payment")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                {[
                  { label: t("paymentStatus"), value: selected.paymentStatus },
                  { label: t("paid"), value: selected.paid ? t("yes") : t("no") },
                  {
                    label: t("subtotal"),
                    value: formatPrice(selected.subtotal ?? 0, lang),
                  },
                  {
                    label: t("commissionFee"),
                    value: formatPrice(selected.commission ?? 0, lang),
                  },
                  {
                    label: "Stripe fee",
                    value: formatPrice(selected.stripeFee ?? 0, lang),
                  },
                  {
                    label: "Cook net",
                    value: formatPrice(selected.cookNet ?? 0, lang),
                  },
                  {
                    label: t("refundAmount"),
                    value: formatPrice(
                      selected.refunded ??
                        (selected.refunds ?? []).reduce(
                          (sum, refund) =>
                            sum + (refund.amount ?? refund.amountCents ?? 0),
                          0,
                        ),
                      lang,
                    ),
                  },
                  {
                    label: "Transfer",
                    value: selected.transfer?.status ?? "—",
                  },
                ].map((field) => (
                  <div key={field.label} className="min-w-0">
                    <p className="truncate text-[11.5px] text-muted-soft">{field.label}</p>
                    <p className="truncate font-semibold text-charcoal">{field.value}</p>
                  </div>
                ))}
              </div>
              {selected.transferEligibleAt ? (
                <p className="mt-2 text-[12px] text-muted">
                  Transfer eligible:{" "}
                  {new Date(selected.transferEligibleAt).toLocaleString(lang)}
                </p>
              ) : null}
            </div>

            {(selected.refunds ?? []).length > 0 ? (
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("refunds")}
                </p>
                <ul className="mt-2 divide-y divide-line/60">
                  {selected.refunds?.map((refund, index) => (
                    <li
                      key={refund.id ?? index}
                      className="flex items-center justify-between gap-2 py-2 text-[13px]"
                    >
                      <span className="truncate text-muted">
                        {refund.reason || t("refund")}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatPrice(refund.amount ?? refund.amountCents ?? 0, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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
                  <User className="size-3.5" />
                  {t("customerName")}
                </span>
                <span className="font-medium text-charcoal">{selected.customer}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#f2d9d0] bg-[#fdf3ef] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#a4412c]">
                {t("refund")}
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                {t("refundableAmount")}: {formatPrice(refundable, lang)}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  inputMode="decimal"
                  aria-label={t("refundAmount")}
                  placeholder="0.00"
                  className="h-10 flex-1 rounded-lg border border-line bg-white px-3 text-[15px] font-semibold outline-none focus:border-terracotta/50"
                />
                <input
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  aria-label={t("resolutionNotePlaceholder")}
                  placeholder={t("resolutionNotePlaceholder")}
                  maxLength={200}
                  className="h-10 flex-1 rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-terracotta/50"
                />
                <Button
                  variant="destructive"
                  loading={refundOrder.isPending}
                  disabled={!refundValid}
                  onClick={() => void submitRefund()}
                >
                  <RotateCcw className="size-4" />
                  {t("refund")}
                </Button>
              </div>
              {refundAmount && !refundValid ? (
                <p className="mt-1.5 text-[12px] text-danger">
                  {t("invalidRefundAmount")}
                </p>
              ) : null}
              <Badge variant="outline" size="sm" className="mt-2">
                {t("refundNote")}
              </Badge>
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelCode(null)}
        onConfirm={() => {
          if (cancelTarget) void updateStatus(cancelTarget.code, "cancelled");
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
