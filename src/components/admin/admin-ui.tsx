"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-provider";
import { cn, formatPrice } from "@/lib/utils";

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#e9e1d3] bg-white shadow-[0_1px_2px_rgba(41,40,36,0.04),0_18px_40px_-32px_rgba(41,40,36,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 md:mb-7 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-terracotta">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[28px] leading-tight tracking-[-0.02em] text-charcoal md:text-[34px]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted md:text-[15.5px]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHead({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5", className)}>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold leading-snug tracking-normal text-charcoal">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatDelta({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const positive = value.trim().startsWith("+") || !value.trim().startsWith("-");
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12.5px] font-semibold", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
          positive ? "bg-[#edf3e6] text-[#4f6b3a]" : "bg-[#fbe9e4] text-[#a4412c]",
        )}
      >
        {positive ? (
          <ArrowUpRight className="size-3" strokeWidth={2.4} />
        ) : (
          <ArrowDownRight className="size-3" strokeWidth={2.4} />
        )}
        {value}
      </span>
      {label ? <span className="font-normal text-muted-soft">{label}</span> : null}
    </span>
  );
}

export function Sparkline({
  data,
  className,
  stroke = "#c65d3a",
  fill = "rgba(198,93,58,0.10)",
}: {
  data: number[];
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  const width = 120;
  const height = 38;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / Math.max(1, data.length - 1)) * width;
    const y = height - 4 - ((value - min) / span) * (height - 8);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  series,
  accent = "#c65d3a",
  foot,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaLabel?: string;
  icon?: React.ReactNode;
  series?: number[];
  accent?: string;
  foot?: React.ReactNode;
}) {
  return (
    <AdminCard className="relative overflow-hidden p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em] text-charcoal tabular-nums md:text-[32px]">
            {value}
          </p>
        </div>
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-100 text-charcoal">
            {icon}
          </span>
        ) : null}
      </div>
      {series ? (
        <div className="mt-3">
          <Sparkline data={series} stroke={accent} fill={`${accent}18`} />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta ? <StatDelta value={delta} label={deltaLabel} /> : null}
        {foot ? <span className="text-[12.5px] text-muted-soft">{foot}</span> : null}
      </div>
    </AdminCard>
  );
}

function smoothPath(points: readonly (readonly [number, number])[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function AreaChart({
  data,
  labels,
  height = 210,
  formatValue = (value: number) => `€${value.toLocaleString("nl-NL")}`,
  color = "#c65d3a",
  className,
}: {
  data: number[];
  labels?: string[];
  height?: number;
  formatValue?: (value: number) => string;
  color?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const width = 600;
  const pad = 10;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((value, index) => {
    const x = pad + (index / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2 - 12);
    return [x, y] as const;
  });
  const line = smoothPath(points);
  const area = `${line} L${width - pad},${height - pad} L${pad},${height - pad} Z`;
  const active = hover === null ? null : points[hover];
  const gradientId = React.useId().replaceAll(":", "");

  return (
    <div className={cn("relative", className)}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            const index = Math.round(ratio * (data.length - 1));
            setHover(Math.min(data.length - 1, Math.max(0, index)));
          }}
          role="img"
          aria-label={formatValue(data[data.length - 1] ?? 0)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((fraction) => (
            <line
              key={fraction}
              x1={pad}
              x2={width - pad}
              y1={pad + fraction * (height - pad * 2)}
              y2={pad + fraction * (height - pad * 2)}
              stroke="#ece4d7"
              strokeWidth={1}
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {active ? (
            <>
              <line
                x1={active[0]}
                x2={active[0]}
                y1={pad}
                y2={height - pad}
                stroke={color}
                strokeOpacity={0.35}
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={active[0]} cy={active[1]} r={4} fill="white" stroke={color} strokeWidth={2.2} vectorEffect="non-scaling-stroke" />
            </>
          ) : null}
        </svg>

        {hover !== null && active ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rtl:translate-x-1/2"
            style={{
              left: `${(active[0] / width) * 100}%`,
              top: `${(active[1] / height) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <div className="whitespace-nowrap rounded-lg bg-charcoal px-2.5 py-1.5 text-[12.5px] font-semibold text-white shadow-lg">
              {formatValue(data[hover])}
              {labels?.[hover] ? (
                <span className="ms-1.5 font-normal text-white/60">{labels[hover]}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {labels ? (
        <div className="mt-2 flex justify-between text-[11.5px] font-medium text-muted-soft">
          {labels.map((label, index) =>
            index === 0 ||
            index === labels.length - 1 ||
            index === Math.floor(labels.length / 2) ? (
              <span key={`${label}-${index}`}>{label}</span>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}

export function BarChart({
  data,
  labels,
  formatValue = (value: number) => String(value),
  className,
  barClassName,
}: {
  data: number[];
  labels?: string[];
  formatValue?: (value: number) => string;
  className?: string;
  barClassName?: string;
}) {
  const max = Math.max(...data) || 1;
  return (
    <div className={className}>
      <div className="flex h-[150px] items-end gap-1.5 md:gap-2.5">
        {data.map((value, index) => (
          <div key={index} className="group relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[5px] bg-cream-200 transition-colors duration-200 group-hover:bg-terracotta/70",
                barClassName,
              )}
              style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full start-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-charcoal px-2 py-1 text-[11.5px] font-semibold text-white group-hover:block rtl:translate-x-1/2">
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>
      {labels ? (
        <div className="mt-2 flex gap-1.5 md:gap-2.5">
          {labels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="flex-1 text-center text-[11.5px] font-medium text-muted-soft"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const statusStyles: Record<
  string,
  { label: string; variant: "default" | "success" | "soft" | "olive" | "saffron" | "destructive" | "outline" }
> = {
  preparing: { label: "statusPreparing", variant: "saffron" },
  confirmed: { label: "statusConfirmed", variant: "soft" },
  ready: { label: "statusReady", variant: "olive" },
  completed: { label: "statusCompleted", variant: "success" },
  cancelled: { label: "statusCancelled", variant: "destructive" },
  paid: { label: "paid", variant: "success" },
  pending: { label: "pending", variant: "saffron" },
  scheduled: { label: "scheduled", variant: "soft" },
  processing: { label: "processingPayouts", variant: "saffron" },
  open: { label: "open", variant: "destructive" },
  review: { label: "underReviewStatus", variant: "saffron" },
  resolved: { label: "resolved", variant: "success" },
  suspended: { label: "suspended", variant: "destructive" },
  verified: { label: "verified", variant: "success" },
  approved: { label: "approved", variant: "success" },
  rejected: { label: "rejected", variant: "destructive" },
  live: { label: "live", variant: "success" },
  paused: { label: "paused", variant: "outline" },
  draft: { label: "draft", variant: "outline" },
  new: { label: "new", variant: "soft" },
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const { t } = useApp();
  const style = statusStyles[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={style.variant} className={cn("capitalize", className)}>
      {t(style.label)}
    </Badge>
  );
}

export function AdminTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[660px] border-collapse text-start">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[#f0e9dc] px-4 py-2.5 text-start text-[11.5px] font-bold uppercase tracking-[0.13em] text-muted-soft first:ps-5 last:pe-5",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-[#f4eee3] px-4 py-3 text-[14px] text-charcoal first:ps-5 last:pe-5",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function RowMenu() {
  const { t } = useApp();
  return (
    <button
      type="button"
      aria-label={t("more")}
      className="grid size-8 place-items-center rounded-lg text-muted-soft transition hover:bg-cream-100 hover:text-charcoal"
    >
      <MoreHorizontal className="size-4" />
    </button>
  );
}

export function MoneyText({
  value,
  className,
  compact,
}: {
  value: number;
  className?: string;
  compact?: boolean;
}) {
  const { lang } = useApp();
  return (
    <span className={cn("font-semibold tabular-nums text-charcoal", className)}>
      {compact && value >= 1000
        ? `€${(value / 1000).toFixed(1)}k`
        : formatPrice(value, lang)}
    </span>
  );
}
