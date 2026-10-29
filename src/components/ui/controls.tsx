"use client";

import * as React from "react";
import { Check, Minus, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:opacity-50",
        checked ? "justify-end bg-terracotta" : "justify-start bg-cream-300",
        className,
      )}
    >
      <span className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all" />
    </button>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl p-3 text-start transition hover:bg-cream/50",
        className,
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          checked
            ? "border-terracotta bg-terracotta text-white"
            : "border-line-strong bg-white",
        )}
      >
        {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug text-charcoal">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function Rating({
  value,
  count,
  size = "sm",
  className,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
  showValue?: boolean;
}) {
  const icon = size === "sm" ? "size-3" : "size-4";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[13px] font-semibold text-charcoal",
        className,
      )}
    >
      <Star
        className={cn(icon, "fill-saffron text-saffron")}
        aria-hidden
      />
      {showValue ? <span>{value.toFixed(1)}</span> : null}
      {typeof count === "number" ? (
        <span className="font-normal text-muted">({count})</span>
      ) : null}
    </span>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn =
    size === "sm"
      ? "size-8 [&_svg]:size-3.5"
      : "size-10 [&_svg]:size-4";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-white p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          "grid place-items-center rounded-full text-charcoal transition hover:bg-cream-100 disabled:opacity-35",
          btn,
        )}
      >
        <Minus />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-5 text-center font-semibold tabular-nums",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          "grid place-items-center rounded-full bg-terracotta text-white transition hover:bg-terracotta-600 disabled:opacity-35",
          btn,
        )}
      >
        <Plus />
      </button>
    </div>
  );
}

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-cream-200",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-terracotta transition-[width] duration-500 ease-out",
          barClassName,
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  scrollable,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 rounded-full bg-cream-100 p-1",
        scrollable && "overflow-x-auto no-scrollbar",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[15px] font-semibold transition-all",
              active
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted hover:text-charcoal",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[12px] font-bold",
                  active
                    ? "bg-terracotta-50 text-terracotta-700"
                    : "bg-cream-200/70 text-muted",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function StatStars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-4",
            star <= Math.round(value)
              ? "fill-saffron text-saffron"
              : "fill-transparent text-line-strong",
          )}
        />
      ))}
    </span>
  );
}

export function Avatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full object-cover ring-2 ring-white",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
