"use client";

import { useMemo, useState } from "react";
import { useAdminAnalyticsQuery } from "@/lib/queries";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/ui/controls";
import {
  AdminCard,
  AdminPageHeader,
  AreaChart,
  KpiCard,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Td,
} from "@/components/admin/admin-ui";
import { useApp } from "@/components/providers/app-provider";
import { formatPrice } from "@/lib/utils";

type AnalyticsTopCook = {
  id: string;
  name: string;
  orders: number;
  rating: number;
  city: string;
};

type AdminAnalyticsResponse = {
  gmv: number;
  commission: number;
  ordersCount: number;
  repeatRate: number;
  revenueSeries: number[];
  topCooks: AnalyticsTopCook[];
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAnalytics(value: unknown): AdminAnalyticsResponse {
  const raw = record(value);
  return {
    gmv: num(raw.gmv),
    commission: num(raw.commission),
    ordersCount: num(raw.ordersCount ?? raw.orders),
    repeatRate: num(raw.repeatRate),
    revenueSeries: Array.isArray(raw.revenueSeries)
      ? raw.revenueSeries.map((point) => num(point))
      : [],
    topCooks: Array.isArray(raw.topCooks)
      ? raw.topCooks.map((item, index): AnalyticsTopCook => {
          const cook = record(item);
          return {
            id: typeof cook.id === "string" ? cook.id : `cook-${index}`,
            name: typeof cook.name === "string" ? cook.name : "—",
            orders: num(cook.orders),
            rating: num(cook.rating),
            city: typeof cook.city === "string" ? cook.city : "—",
          };
        })
      : [],
  };
}

export default function AdminAnalyticsPage() {
  const { t, lang } = useApp();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data, isPending, isError } = useAdminAnalyticsQuery(range);
  const analytics = useMemo(() => normalizeAnalytics(data), [data]);

  if (isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        eyebrow="Operations"
        title="Analytics"
        subtitle={t("analyticsSubtitle")}
        actions={
          <SegmentedTabs
            value={range}
            onChange={setRange}
            tabs={[
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
              { value: "90d", label: "90d" },
            ]}
          />
        }
      />

      {isError ? (
        <AdminCard className="px-5 py-8 text-center text-sm text-danger">
          <p role="alert">{t("loadError")}</p>
        </AdminCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="GMV"
              value={<span className="tabular-nums">{formatPrice(analytics.gmv, lang)}</span>}
            />
            <KpiCard
              label={t("commissionRevenue")}
              value={<span className="tabular-nums">{formatPrice(analytics.commission, lang)}</span>}
            />
            <KpiCard
              label={t("orders")}
              value={<span className="tabular-nums">{analytics.ordersCount.toLocaleString(lang)}</span>}
            />
            <KpiCard
              label="Repeat rate"
              value={<span className="tabular-nums">{Math.round(analytics.repeatRate * 100)}%</span>}
            />
          </div>

          {analytics.revenueSeries.length ? (
            <AdminCard className="mt-4 p-4 md:p-5">
              <h2 className="text-[15px] font-bold text-charcoal">
                {t("revenueOverview")}
              </h2>
              <AreaChart
                className="mt-3"
                data={analytics.revenueSeries}
                formatValue={(value) => formatPrice(value, lang)}
              />
            </AdminCard>
          ) : null}

          <AdminCard className="mt-4">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
              <h2 className="text-[15px] font-bold text-charcoal">{t("adminTopCooks")}</h2>
              <span className="text-[12.5px] text-muted">
                {analytics.topCooks.length} {t("cooks").toLowerCase()}
              </span>
            </div>
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cookCol")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("city")}</TableHead>
                  <TableHead>{t("orders")}</TableHead>
                  <TableHead>{t("ratingCol")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topCooks.map((cook) => (
                  <TableRow key={cook.id}>
                    <Td className="font-semibold">{cook.name}</Td>
                    <Td className="hidden text-muted md:table-cell">{cook.city}</Td>
                    <Td className="tabular-nums">{cook.orders.toLocaleString(lang)}</Td>
                    <Td className="tabular-nums">★ {cook.rating.toFixed(1)}</Td>
                  </TableRow>
                ))}
                {analytics.topCooks.length === 0 ? (
                  <TableRow>
                    <Td colSpan={4} className="text-center text-muted">
                      {t("noResults")}
                    </Td>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </AdminCard>
        </>
      )}
    </div>
  );
}
