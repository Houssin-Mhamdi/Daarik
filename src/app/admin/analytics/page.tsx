"use client";

import { useState } from "react";
import { useAdminAnalyticsQuery } from "@/lib/queries";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data, isPending } = useAdminAnalyticsQuery(range);

  if (isPending) return <PageSkeleton />;

  const d = (data ?? {}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] text-charcoal">Analytics</h1>
        <div className="flex gap-1.5">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                range === r ? "border-terracotta bg-terracotta text-white" : "border-line bg-white text-charcoal"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">GMV</p>
          <p className="mt-1 text-[20px] font-bold text-charcoal">€{Number(d.gmv ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">Commission</p>
          <p className="mt-1 text-[20px] font-bold text-charcoal">€{Number(d.commission ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">Orders</p>
          <p className="mt-1 text-[20px] font-bold text-charcoal">{d.ordersCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">Repeat rate</p>
          <p className="mt-1 text-[20px] font-bold text-charcoal">{Math.round((d.repeatRate ?? 0) * 100)}%</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[15px] font-bold text-charcoal">Top cooks</h2>
        <div className="mt-3 space-y-2">
          {(d.topCooks ?? []).map((c: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-line/60 px-3 py-2">
              <span className="text-[14px] font-semibold text-charcoal">{c.name}</span>
              <span className="text-[12px] text-muted">{c.orders} orders · {c.rating}★ · {c.city}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
