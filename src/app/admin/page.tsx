"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDot,
  Clock3,
  Download,
  Euro,
  Globe2,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/controls";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AreaChart,
  BarChart,
  KpiCard,
  MoneyText,
  SectionHead,
  StatusPill,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  VerificationSheet,
  type Applicant,
  type ApplicantDocumentLink,
} from "@/components/admin/verification-sheet";
import {
  useAdminApproveVerificationMutation,
  useAdminDisputesQuery,
  useAdminOverviewQuery,
  useAdminRequestVerificationChangesMutation,
} from "@/lib/queries";
import type { AdminOverviewResponse } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";

type CuisineSlice = { name: string; orders: number; share: number };
type OverviewCook = AdminOverviewResponse["topCooks"][number];

function initialsOf(name: string): string {
  return String(name || "C")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution when the CSV is opened in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function dateLabels(days: number, lang: string): string[] {
  const formatter = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
  });
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    return formatter.format(date);
  });
}

function extractDocumentLinks(app: Record<string, unknown>): ApplicantDocumentLink[] {
  const candidates =
    app.documentLinks ?? app.documents ?? app.documentUrls ?? app.files ?? [];
  if (Array.isArray(candidates)) {
    return candidates
      .map((item): ApplicantDocumentLink => {
        if (typeof item === "string") {
          return { url: item, name: item.split("/").pop() };
        }
        const raw = item as Record<string, unknown>;
        return {
          url:
            typeof raw.url === "string"
              ? raw.url
              : typeof raw.href === "string"
                ? raw.href
                : undefined,
          name:
            typeof raw.name === "string"
              ? raw.name
              : typeof raw.fileName === "string"
                ? raw.fileName
                : undefined,
          size: typeof raw.size === "number" ? raw.size : undefined,
          label: typeof raw.label === "string" ? raw.label : undefined,
        };
      })
      .filter((doc) => Boolean(doc.url));
  }
  if (candidates && typeof candidates === "object") {
    return Object.entries(candidates as Record<string, unknown>)
      .map(([label, value]) => ({
        label,
        url: typeof value === "string" ? value : undefined,
      }))
      .filter((doc) => Boolean(doc.url));
  }
  return [];
}

export default function AdminDashboardPage() {
  const { t, lang, toast } = useApp();
  const [range, setRange] = useState<"30d" | "90d">("30d");
  const { data: overview, refetch } = useAdminOverviewQuery(range);
  const { data: disputes = [] } = useAdminDisputesQuery();
  const approveVerification = useAdminApproveVerificationMutation();
  const requestChanges = useAdminRequestVerificationChangesMutation();
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [busy, setBusy] = useState(false);

  const kpis = overview?.kpis;
  const recentOrders = overview?.recentOrders ?? [];
  const days = range === "90d" ? 90 : 30;

  const cuisines: CuisineSlice[] = useMemo(() => {
    const raw = (overview as unknown as Record<string, unknown> | null)
      ?.cuisineDistribution;
    return (Array.isArray(raw) ? raw : (overview?.topCuisines ?? [])) as CuisineSlice[];
  }, [overview]);
  const cuisineOrders = cuisines.reduce((sum, item) => sum + item.orders, 0);

  const queue: Applicant[] = useMemo(
    () =>
      (overview?.verificationQueue ?? []).map((app) => {
        const raw = app as unknown as Record<string, unknown>;
        const documentLinks = extractDocumentLinks(raw);
        return {
          id: app.id,
          name: app.name,
          city: app.city,
          cuisine: app.cuisine || "—",
          submitted: app.submittedAt
            ? new Date(app.submittedAt).toLocaleDateString(lang)
            : "—",
          documents: app.documentsCount ?? documentLinks.length ?? 0,
          documentLinks,
          initials: initialsOf(app.name),
        };
      }),
    [overview?.verificationQueue, lang],
  );

  const revenueSeries = useMemo(() => {
    const series = overview?.revenueSeries ?? [];
    return series.length ? series : Array.from({ length: days }, () => 0);
  }, [overview?.revenueSeries, days]);

  const weeklyOrders = overview?.weeklyOrders ?? [0];
  const periodLabels = useMemo(() => dateLabels(revenueSeries.length, lang), [
    revenueSeries.length,
    lang,
  ]);
  const weekLabels = useMemo(() => dateLabels(weeklyOrders.length, lang), [
    weeklyOrders.length,
    lang,
  ]);
  const totalRevenue = revenueSeries.reduce((sum, value) => sum + value, 0);
  const weeklyTotal = weeklyOrders.reduce((sum, value) => sum + value, 0);

  const exportCsv = () => {
    const header = ["Order", "Customer", "Cook", "Amount", "Status", "Pickup"];
    const lines = recentOrders.map((order) =>
      [
        order.code,
        order.customer,
        order.cook,
        order.amount,
        order.status,
        order.pickup,
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
    anchor.download = "daarik-recent-orders.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(t("exportReady"), { description: t("exportReadyDesc") });
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await refetch();
      toast(t("dataRefreshed"));
    } finally {
      setBusy(false);
    }
  };

  const approve = async (applicant: Applicant, reviewerNote: string) => {
    setBusy(true);
    try {
      await approveVerification.mutateAsync({
        id: applicant.id,
        notes: reviewerNote,
      });
      setSelected(null);
      toast(t("approvedToast"), { description: applicant.name });
    } catch (error) {
      toast(t("error"), {
        description: error instanceof Error ? error.message : String(error),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const reject = async (applicant: Applicant, reviewerNote: string) => {
    setBusy(true);
    try {
      await requestChanges.mutateAsync({
        id: applicant.id,
        notes: reviewerNote,
      });
      setSelected(null);
      toast(t("rejectedToast"), {
        description: applicant.name,
        variant: "info",
      });
    } catch (error) {
      toast(t("error"), {
        description: error instanceof Error ? error.message : String(error),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("adminOverview")}
        title={t("adminDashboardTitle")}
        subtitle={`${t("adminApp")} · ${range === "30d" ? t("last30days") : t("last90days")}`}
        actions={
          <>
            <div className="flex h-9 items-center rounded-full border border-[#e4dbc9] bg-white p-0.5">
              {(["30d", "90d"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cn(
                    "h-8 rounded-full px-3 text-[13px] font-semibold transition",
                    range === option
                      ? "bg-charcoal text-cream"
                      : "text-muted hover:text-charcoal",
                  )}
                >
                  {option === "30d" ? t("last30days") : t("last90days")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={busy}
              aria-label={t("refresh")}
              className="grid size-9 place-items-center rounded-full border border-[#e4dbc9] bg-white text-charcoal transition hover:border-line-strong disabled:opacity-50"
            >
              <RefreshCw className={cn("size-4", busy && "animate-spin")} />
            </button>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={exportCsv}
            >
              <Download className="size-4" />
              {t("exportCsv")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("gmv")}
          value={<MoneyText value={kpis?.gmv ?? 0} compact />}
          foot={`${t("avgOrder")}: ${formatPrice(kpis?.avgOrder ?? 0, lang)}`}
          icon={<Euro className="size-4" />}
        />
        <KpiCard
          label={t("commissionRevenue")}
          value={<MoneyText value={kpis?.commission ?? 0} compact />}
          foot={`${t("serviceFee")}: ${formatPrice(kpis?.serviceFee ?? 0, lang)}`}
          icon={<TrendingUp className="size-4" />}
          accent="#697653"
        />
        <KpiCard
          label={t("activeCooks")}
          value={kpis?.activeCooks ?? 0}
          foot={t("liveKitchens")}
          icon={<Store className="size-4" />}
          accent="#d9a441"
        />
        <KpiCard
          label={t("ordersToday")}
          value={kpis?.ordersToday ?? 0}
          foot={`${t("activeCustomers")}: ${(kpis?.activeCustomers ?? 0).toLocaleString(lang)}`}
          icon={<ShoppingBag className="size-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <AdminCard className="lg:col-span-8">
          <div className="flex flex-col gap-3 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold text-charcoal">
                  {t("revenueOverview")}
                </h3>
                <p className="mt-0.5 text-[13.5px] text-muted">
                  {t("revenueChartNote")}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
                  {formatPrice(totalRevenue, lang)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#4f6b3a]">
                  <ArrowUpRight className="size-3.5" />
                  {periodLabels[0] ?? "—"} – {periodLabels.at(-1) ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-terracotta" />
                {t("commissionRevenue")} + {t("serviceFee")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cream-300" />
                {t("gmv")}
              </span>
              <span className="ms-auto hidden items-center gap-1 sm:inline-flex">
                <Clock3 className="size-3" />
                {t("updatedJustNow")}
              </span>
            </div>
            <AreaChart
              data={revenueSeries}
              labels={periodLabels}
              height={216}
              className="mt-1"
            />
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-4">
          <SectionHead
            title={t("topCuisines")}
            subtitle={t("ordersThisMonth", { count: cuisineOrders })}
            action={
              <Link
                href="/admin/orders"
                className="text-[13px] font-semibold text-terracotta hover:underline"
              >
                {t("viewAllAdmin")}
              </Link>
            }
          />
          <div className="p-4 pt-3 md:p-5 md:pt-4">
            <div className="relative mx-auto mb-4 grid size-[136px] place-items-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
                {cuisines.map((cuisine, index) => {
                  const radius = 46;
                  const circumference = 2 * Math.PI * radius;
                  const before = cuisines
                    .slice(0, index)
                    .reduce((sum, item) => sum + item.share, 0);
                  const dash = (cuisine.share / 100) * circumference;
                  const colors = [
                    "#c65d3a",
                    "#697653",
                    "#d9a441",
                    "#b98a68",
                    "#ded1bd",
                  ];
                  return (
                    <circle
                      key={cuisine.name}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={colors[index % colors.length]}
                      strokeWidth="11"
                      strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
                      strokeDashoffset={-(before / 100) * circumference}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="text-center">
                <p className="text-[22px] font-semibold leading-none text-charcoal">
                  {cuisineOrders.toLocaleString(lang)}
                </p>
                <p className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-muted-soft">
                  {t("orders")}
                </p>
              </div>
            </div>
            {cuisines.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">
                No cuisine data for this period.
              </p>
            ) : (
              <div className="space-y-2">
                {cuisines.map((cuisine, index) => (
                  <div
                    key={cuisine.name}
                    className="flex items-center gap-2 text-[13.5px]"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        background: [
                          "#c65d3a",
                          "#697653",
                          "#d9a441",
                          "#b98a68",
                          "#ded1bd",
                        ][index % 5],
                      }}
                    />
                    <span className="flex-1 font-medium text-charcoal">
                      {cuisine.name}
                    </span>
                    <span className="tabular-nums text-muted">
                      {cuisine.orders.toLocaleString(lang)}
                    </span>
                    <span className="w-9 text-end font-semibold tabular-nums text-charcoal">
                      {cuisine.share}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <AdminCard className="lg:col-span-8">
          <SectionHead
            title={t("recentOrders")}
            subtitle={t("ordersThisMonth", { count: recentOrders.length })}
            action={
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-terracotta hover:underline"
              >
                {t("viewAllAdmin")}
                <ArrowRight className="size-3 rtl:rotate-180" />
              </Link>
            }
          />
          <AdminTable className="mt-3">
            <TableHeader>
              <TableRow>
                <Th>{t("orderId")}</Th>
                <Th>{t("customerCol")}</Th>
                <Th className="hidden md:table-cell">{t("cookCol")}</Th>
                <Th>{t("amountCol")}</Th>
                <Th>{t("statusCol")}</Th>
                <Th className="hidden lg:table-cell">{t("pickupCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="group">
                  <Td className="font-semibold">{order.code}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[11px] font-bold text-charcoal">
                        {initialsOf(order.customer)}
                      </span>
                      <span className="truncate">{order.customer}</span>
                    </div>
                  </Td>
                  <Td className="hidden text-muted md:table-cell">{order.cook}</Td>
                  <Td>
                    <MoneyText value={order.amount} className="text-[14px]" />
                  </Td>
                  <Td>
                    <StatusPill status={order.status} />
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted lg:table-cell">
                    {order.pickup}
                  </Td>
                  <Td className="text-end">
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(order.code)}`}
                      className="rounded-lg px-2 py-1 text-[13px] font-semibold text-terracotta opacity-0 transition hover:bg-terracotta-50 group-hover:opacity-100"
                    >
                      {t("viewDetails")}
                    </Link>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </AdminTable>
        </AdminCard>

        <AdminCard className="lg:col-span-4">
          <SectionHead
            title={t("verificationQueue")}
            subtitle={t("pendingReviewNote")}
            action={
              <span className="rounded-full bg-saffron-50 px-2 py-1 text-[12px] font-bold text-[#8a5d13]">
                {queue.length}
              </span>
            }
          />
          <div className="space-y-2 p-4 pt-3 md:p-5 md:pt-4">
            {queue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong bg-cream/50 px-4 py-8 text-center">
                <ShieldCheck className="mx-auto size-6 text-olive" />
                <p className="mt-2 text-[14.5px] font-semibold text-charcoal">
                  {t("allCaughtUp")}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {t("pendingReviewNote")}
                </p>
              </div>
            ) : (
              queue.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex items-center gap-3 rounded-xl border border-line/80 bg-cream/35 p-2.5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[13px] font-bold text-charcoal ring-1 ring-line">
                    {applicant.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-charcoal">
                      {applicant.name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {applicant.cuisine} · {applicant.city} ·{" "}
                      {applicant.submitted}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(applicant)}
                    className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[12px] font-semibold text-charcoal shadow-sm ring-1 ring-line transition hover:ring-line-strong"
                  >
                    {t("reviewDocs")}
                  </button>
                </div>
              ))
            )}
            <Link
              href="/admin/cooks"
              className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-white text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong"
            >
              {t("viewAllAdmin")}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <AdminCard className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                {t("payoutsDue")}
              </p>
              <p className="mt-2 text-[26px] font-semibold leading-none text-charcoal">
                {formatPrice(
                  (kpis?.pendingTransfersCents ?? 0) / 100,
                  lang,
                )}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {kpis?.pendingVerifications ?? 0} {t("pending").toLowerCase()}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-olive-50 text-olive">
              <Wallet className="size-4" />
            </span>
          </div>
          <Link
            href="/admin/payouts"
            className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full bg-charcoal text-[13.5px] font-semibold text-cream transition hover:bg-charcoal-soft"
          >
            {t("payoutBatch")}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </AdminCard>

        <AdminCard className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                {t("openDisputes")}
              </p>
              <p className="mt-2 text-[26px] font-semibold leading-none text-charcoal">
                {kpis?.disputes ?? 0}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {formatPrice(
                  disputes.reduce((sum, dispute) => sum + (dispute.amount ?? 0), 0),
                  lang,
                )}{" "}
                · {t("refundAmount").toLowerCase()}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-[#fbe9e4] text-[#a4412c]">
              <CircleDot className="size-4" />
            </span>
          </div>
          <div className="mt-3 space-y-1">
            {disputes.slice(0, 2).map((dispute) => (
              <div
                key={dispute.id}
                className="flex items-center justify-between gap-2 text-[12.5px]"
              >
                <span className="truncate text-muted">
                  {dispute.code} · {dispute.reason}
                </span>
                <StatusPill status={dispute.status} className="shrink-0 scale-90" />
              </div>
            ))}
          </div>
          <Link
            href="/admin/disputes"
            className="mt-2 flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-white text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            {t("resolve")}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </AdminCard>

        <AdminCard className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                {t("systemHealth")}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[19px] font-semibold leading-none text-[#4f6b3a]">
                <span className="size-2 rounded-full bg-[#7d9a5c]" />
                {overview ? t("allSystemsOk") : "Loading…"}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-charcoal">
              <Globe2 className="size-4" />
            </span>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            {[
              {
                label: t("refundRate"),
                value: `${kpis?.refundRate ?? 0}%`,
              },
              {
                label: "Orders / hour (today)",
                value: String(kpis?.ordersToday ?? 0),
              },
              {
                label: t("avgOrder"),
                value: formatPrice(kpis?.avgOrder ?? 0, lang),
              },
              {
                label: "Range",
                value: overview?.range ?? days + "d",
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-muted">{row.label}</span>
                <span className="font-semibold tabular-nums text-charcoal">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <AdminCard className="lg:col-span-7">
          <SectionHead
            title={t("adminTopCooks")}
            subtitle={t("adminTopCooksSub")}
            action={
              <Link
                href="/admin/cooks"
                className="text-[13px] font-semibold text-terracotta hover:underline"
              >
                {t("viewAllAdmin")}
              </Link>
            }
          />
          <AdminTable className="mt-3">
            <TableHeader>
              <TableRow>
                <Th>{t("cookCol")}</Th>
                <Th className="hidden sm:table-cell">{t("city")}</Th>
                <Th>{t("orders")}</Th>
                <Th>{t("ratingCol")}</Th>
                <Th className="hidden md:table-cell">{t("verificationCol")}</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(overview?.topCooks ?? []).map((cook: OverviewCook) => (
                <TableRow key={cook.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar src={cook.avatar ?? ""} alt={cook.name} size={28} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{cook.name}</p>
                        <p className="truncate text-[12px] text-muted">
                          {cook.city}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden text-muted sm:table-cell">{cook.city}</Td>
                  <Td className="font-semibold tabular-nums">
                    {cook.ordersCount.toLocaleString(lang)}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
                      ★ {(cook.rating ?? 0).toFixed(1)}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <StatusPill status={cook.status} />
                  </Td>
                </TableRow>
              ))}
              {(overview?.topCooks ?? []).length === 0 ? (
                <TableRow>
                  <Td colSpan={5} className="text-center text-muted">
                    No cook data for this period.
                  </Td>
                </TableRow>
              ) : null}
            </TableBody>
          </AdminTable>
        </AdminCard>

        <AdminCard className="lg:col-span-5">
          <SectionHead
            title={t("weeklyOrders")}
            subtitle={t("ordersChartNote")}
            action={<StatusPill status="live" />}
          />
          <div className="p-4 pt-4 md:p-5">
            <div className="mb-3 flex items-end gap-2">
              <p className="text-[26px] font-semibold leading-none text-charcoal">
                {weeklyTotal.toLocaleString(lang)}
              </p>
              <span className="mb-0.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#4f6b3a]">
                <TrendingUp className="size-3" />
                {weekLabels[0] ?? "—"} – {weekLabels.at(-1) ?? "—"}
              </span>
            </div>
            <BarChart
              data={weeklyOrders}
              labels={weekLabels.map((label) => label.split(" ")[0])}
              formatValue={(value) => `${value} ${t("orders")}`}
            />
            <div className="mt-4 flex items-center justify-between rounded-xl bg-cream/60 p-3 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <UtensilsCrossed className="size-3.5" />
                {t("liveKitchens")}
              </span>
              <span className="font-semibold text-charcoal">
                {kpis?.activeCooks ?? 0}
              </span>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line-strong bg-white/50 px-4 py-3 text-[13px] text-muted">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-3.5 text-terracotta" />
          {t("adminFooterNote")}
        </span>
        <span className="hidden items-center gap-1.5 md:inline-flex">
          <Users className="size-3.5" />
          {t("activeCustomers")}: {(kpis?.activeCustomers ?? 0).toLocaleString(lang)}
        </span>
      </div>

      <VerificationSheet
        applicant={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onApprove={(applicant, reviewerNote) => void approve(applicant, reviewerNote)}
        onReject={(applicant, reviewerNote) => void reject(applicant, reviewerNote)}
      />
    </div>
  );
}
