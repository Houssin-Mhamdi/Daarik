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
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  VerificationSheet,
  type Applicant,
} from "@/components/admin/verification-sheet";
import {
  adminDisputes,
  adminKpis,
  adminOrders,
  adminPayouts,
  cooks,
  revenueSeries,
  topCuisines,
  verificationQueue,
} from "@/lib/data";
import { useAdminOverviewQuery } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminDashboardPage() {
  const { t, lang, toast } = useApp();
  const [range, setRange] = useState<"30d" | "90d">("30d");
  const { data: overview, refetch } = useAdminOverviewQuery(range);
  const [queue, setQueue] = useState(verificationQueue);
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const revenue = useMemo(() => {
    if (Array.isArray(overview?.revenueSeries) && overview.revenueSeries.length) {
      return overview.revenueSeries as number[];
    }
    if (range === "30d") return revenueSeries;
    return Array.from({ length: 30 }, (_, index) => {
      const base = revenueSeries[index] ?? 2600;
      return Math.round(base * 2.85 + Math.sin(index / 2) * 180);
    });
  }, [overview, range]);

  const totalRevenue = revenue.reduce((sum, value) => sum + value, 0);
  const payoutsDue = adminPayouts
    .filter((payout) => payout.status !== "paid")
    .reduce((sum, payout) => sum + payout.net, 0);
  const pendingCount = adminPayouts.filter((p) => p.status !== "paid").length;

  const exportCsv = () => {
    const header = ["Order", "Customer", "Cook", "Amount", "Status", "Pickup"];
    const lines = adminOrders.map((order) =>
      [order.code, order.customer, order.cook, order.amount, order.status, order.pickup]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "darna-orders.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(t("exportReady"), { description: t("exportReadyDesc") });
  };

  const refresh = () => {
    setRefreshing(true);
    refetch().finally(() => {
      window.setTimeout(() => {
        setRefreshing(false);
        toast(t("dataRefreshed"));
      }, 450);
    });
  };

  const gridLabels = [
    "1 Oct",
    "8 Oct",
    "15 Oct",
    "22 Oct",
    range === "30d" ? "29 Oct" : "29 Dec",
  ];

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("adminOverview")}
        title={t("adminDashboardTitle")}
        subtitle={t("overviewOf", { city: "Rotterdam" })}
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
              onClick={refresh}
              aria-label={t("refresh")}
              className="grid size-9 place-items-center rounded-full border border-[#e4dbc9] bg-white text-charcoal transition hover:border-line-strong"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
            <Button variant="secondary" size="sm" className="h-9" onClick={exportCsv}>
              <Download className="size-4" />
              {t("exportCsv")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("gmv")}
          value={<MoneyText value={adminKpis.gmv} compact />}
          delta="+12.4%"
          deltaLabel={t("vsLastMonth")}
          icon={<Euro className="size-4" />}
          series={[18, 22, 20, 26, 24, 30, 28, 34, 32, 38]}
        />
        <KpiCard
          label={t("commissionRevenue")}
          value={<MoneyText value={adminKpis.commission} compact />}
          delta="+9.8%"
          deltaLabel={t("vsLastMonth")}
          icon={<TrendingUp className="size-4" />}
          series={[12, 15, 14, 18, 17, 21, 20, 24, 25, 28]}
          accent="#697653"
        />
        <KpiCard
          label={t("activeCooks")}
          value={adminKpis.activeCooks}
          delta="+18"
          deltaLabel={t("newCooksThisMonth", { count: adminKpis.newCooks })}
          icon={<Store className="size-4" />}
          series={[190, 198, 204, 210, 208, 221, 228, 235, 240, 247]}
          accent="#d9a441"
        />
        <KpiCard
          label={t("ordersToday")}
          value={adminKpis.ordersToday}
          delta="+6.2%"
          deltaLabel={t("vsLastMonth")}
          icon={<ShoppingBag className="size-4" />}
          series={[120, 138, 130, 152, 144, 166, 158, 172, 168, 186]}
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
                <p className="mt-0.5 text-[13.5px] text-muted">{t("revenueChartNote")}</p>
              </div>
              <div className="text-end">
                <p className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-charcoal">
                  {formatPrice(totalRevenue, lang)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#4f6b3a]">
                  <ArrowUpRight className="size-3.5" />
                  11.2% {t("vsLastMonth")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-terracotta" />
                {t("commissionRevenue")}
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
            <AreaChart data={revenue} labels={gridLabels} height={216} className="mt-1" />
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-4">
          <SectionHead
            title={t("topCuisines")}
            subtitle={t("ordersThisMonth", { count: "4,020" })}
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
                {topCuisines.map((cuisine, index) => {
                  const radius = 46;
                  const circumference = 2 * Math.PI * radius;
                  const before = topCuisines
                    .slice(0, index)
                    .reduce((sum, item) => sum + item.share, 0);
                  const dash = (cuisine.share / 100) * circumference;
                  const colors = ["#c65d3a", "#697653", "#d9a441", "#b98a68", "#ded1bd"];
                  return (
                    <circle
                      key={cuisine.name}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={colors[index]}
                      strokeWidth="11"
                      strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
                      strokeDashoffset={-(before / 100) * circumference}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="text-center">
                <p className="text-[22px] font-semibold leading-none text-charcoal">4.0k</p>
                <p className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-muted-soft">
                  {t("orders")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {topCuisines.map((cuisine, index) => (
                <div key={cuisine.name} className="flex items-center gap-2 text-[13.5px]">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      background: ["#c65d3a", "#697653", "#d9a441", "#b98a68", "#ded1bd"][index],
                    }}
                  />
                  <span className="flex-1 font-medium text-charcoal">{cuisine.name}</span>
                  <span className="tabular-nums text-muted">
                    {cuisine.orders.toLocaleString("nl-NL")}
                  </span>
                  <span className="w-8 text-end font-semibold tabular-nums text-charcoal">
                    {cuisine.share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <AdminCard className="lg:col-span-8">
          <SectionHead
            title={t("recentOrders")}
            subtitle={t("ordersThisMonth", { count: adminKpis.ordersToday })}
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
            <thead>
              <tr>
                <Th>{t("orderId")}</Th>
                <Th>{t("customerCol")}</Th>
                <Th className="hidden md:table-cell">{t("cookCol")}</Th>
                <Th>{t("amountCol")}</Th>
                <Th>{t("statusCol")}</Th>
                <Th className="hidden lg:table-cell">{t("pickupCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((order) => (
                <tr key={order.code} className="group transition hover:bg-cream/40">
                  <Td className="font-semibold">{order.code}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[11px] font-bold text-charcoal">
                        {order.customer
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
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
                      href="/admin/orders"
                      className="rounded-lg px-2 py-1 text-[13px] font-semibold text-terracotta opacity-0 transition hover:bg-terracotta-50 group-hover:opacity-100"
                    >
                      {t("viewDetails")}
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
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
                <p className="mt-2 text-[14.5px] font-semibold text-charcoal">{t("allCaughtUp")}</p>
                <p className="mt-0.5 text-[13px] text-muted">{t("pendingReviewNote")}</p>
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
                      {applicant.cuisine} · {applicant.city} · {applicant.submitted}
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
                {formatPrice(payoutsDue, lang)}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {pendingCount} {t("cooksLabel").toLowerCase()} · {t("payoutSchedule")}
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
                {adminKpis.disputes}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {formatPrice(
                  adminDisputes.reduce((sum, dispute) => sum + dispute.amount, 0),
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
            {adminDisputes.slice(0, 2).map((dispute) => (
              <div key={dispute.id} className="flex items-center justify-between gap-2 text-[12.5px]">
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
                {t("allSystemsOk")}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-charcoal">
              <Globe2 className="size-4" />
            </span>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            {[
              { label: t("uptime"), value: "99.98%" },
              { label: t("failedPayments"), value: "0.4%" },
              { label: t("ordersPerHour"), value: "28" },
              { label: t("avgOrder"), value: formatPrice(adminKpis.avgOrder, lang) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-muted">{row.label}</span>
                <span className="font-semibold tabular-nums text-charcoal">{row.value}</span>
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
            <thead>
              <tr>
                <Th>{t("cookCol")}</Th>
                <Th className="hidden sm:table-cell">{t("city")}</Th>
                <Th>{t("salesCol")}</Th>
                <Th>{t("ratingCol")}</Th>
                <Th className="hidden md:table-cell">{t("verificationCol")}</Th>
              </tr>
            </thead>
            <tbody>
              {[...cooks]
                .sort((a, b) => b.rating - a.rating)
                .map((cook) => (
                  <tr key={cook.id} className="transition hover:bg-cream/40">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={cook.avatar} alt={cook.name} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{cook.name}</p>
                          <p className="truncate text-[12px] text-muted">
                            {cook.specialties[lang]}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden text-muted sm:table-cell">{cook.city}</Td>
                    <Td>
                      <MoneyText value={Math.round(cook.orders * 18.4)} compact />
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
                        ★ {cook.rating.toFixed(1)}
                      </span>
                      <span className="ms-1 text-[12px] text-muted">({cook.reviewCount})</span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#4f6b3a]">
                        <ShieldCheck className="size-3.5" />
                        {t("verified")}
                      </span>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </AdminTable>
        </AdminCard>

        <AdminCard className="lg:col-span-5">
          <SectionHead
            title={t("weeklyOrders")}
            subtitle={t("ordersChartNote")}
            action={<StatusPill status={"live"} />}
          />
          <div className="p-4 pt-4 md:p-5">
            <div className="mb-3 flex items-end gap-2">
              <p className="text-[26px] font-semibold leading-none text-charcoal">1,284</p>
              <span className="mb-0.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#4f6b3a]">
                <TrendingUp className="size-3" /> +8.1%
              </span>
            </div>
            <BarChart
              data={[148, 176, 152, 196, 214, 246, 152].map((value, index) =>
                index === 6 ? Math.round(value * 0.6) : value,
              )}
              labels={weekdayLabels.map((day) =>
                lang === "ar"
                  ? ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"][weekdayLabels.indexOf(day)]
                  : day,
              )}
              formatValue={(value) => `${value} ${t("orders")}`}
            />
            <div className="mt-4 flex items-center justify-between rounded-xl bg-cream/60 p-3 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <UtensilsCrossed className="size-3.5" />
                {t("liveKitchens")}
              </span>
              <span className="font-semibold text-charcoal">184</span>
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
          {t("activeCustomers")}: {adminKpis.activeCustomers.toLocaleString("nl-NL")}
        </span>
      </div>

      <VerificationSheet
        applicant={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onApprove={(applicant) => {
          setQueue((prev) => prev.filter((item) => item.id !== applicant.id));
          setSelected(null);
          toast(t("approvedToast"), { description: applicant.name });
        }}
        onReject={(applicant) => {
          setQueue((prev) => prev.filter((item) => item.id !== applicant.id));
          setSelected(null);
          toast(t("rejectedToast"), { description: applicant.name, variant: "info" });
        }}
      />
    </div>
  );
}
