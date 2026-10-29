"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[480px] px-4 md:max-w-[1240px] md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Money({
  value,
  className,
  prefix,
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const { lang } = useApp();
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix ? <span className="me-1 text-[0.75em] font-medium">{prefix}</span> : null}
      {formatPrice(value, lang)}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  href,
  actionLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3.5 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.01em] text-charcoal md:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-[14.5px] leading-snug text-muted md:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 pb-0.5 text-[14.5px] font-semibold text-terracotta transition hover:text-terracotta-700"
        >
          {actionLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  backHref,
  action,
  mobileAction,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  action?: React.ReactNode;
  mobileAction?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const { dir } = useApp();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 -mx-4 mb-3 border-b border-line/50 bg-cream/90 px-4 py-2 backdrop-blur-xl md:static md:mx-0 md:mb-6 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
        className,
      )}
    >
      <div className="flex items-center gap-1 md:hidden">
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          aria-label="Go back"
          className="-ms-2 grid size-10 shrink-0 place-items-center rounded-full text-charcoal transition hover:bg-cream-100"
        >
          {dir === "rtl" ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-sans text-[17px] font-semibold tracking-normal text-charcoal">
            {title}
          </h1>
        </div>
        {mobileAction}
      </div>
      <div className="hidden items-end justify-between gap-4 md:flex">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-[13px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[34px] font-semibold leading-tight text-charcoal">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
  emoji,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  emoji?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14.5px] font-semibold transition-all",
        active
          ? "border-terracotta bg-terracotta text-white shadow-[0_6px_16px_-10px_rgba(198,93,58,0.8)]"
          : "border-line bg-white text-charcoal hover:border-line-strong",
        className,
      )}
    >
      {emoji ? <span className="text-[15px] leading-none">{emoji}</span> : null}
      {children}
    </button>
  );
}

export function StickyActionBar({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-cream/95 shadow-nav backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[480px] items-center gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 md:max-w-4xl md:px-8",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SettingRow({
  icon,
  title,
  description,
  href,
  right,
  onClick,
  destructive,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  href?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {icon ? (
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            destructive
              ? "bg-[#f9e3dd] text-[#a13a28]"
              : "bg-cream-100 text-charcoal",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[15.5px] font-semibold leading-snug",
            destructive ? "text-[#a13a28]" : "text-charcoal",
          )}
        >
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>
      {right ?? (
        <ChevronRight className="size-4 shrink-0 text-muted-soft rtl:rotate-180" />
      )}
    </>
  );

  const cls = cn(
    "flex w-full items-center gap-3 px-3.5 py-3 text-start transition hover:bg-cream/60",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

export function Card({
  children,
  className,
  as,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "rounded-[22px] border border-line/80 bg-white shadow-card",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function Accordion({
  items,
  className,
}: {
  items: { question: string; answer: string }[];
  className?: string;
}) {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-white", className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-3 p-4 text-start"
            >
              <span className="min-w-0 flex-1 text-[15.5px] font-semibold leading-snug text-charcoal">
                {item.question}
              </span>
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 transition-transform duration-300",
                  isOpen && "rotate-45 bg-terracotta text-white",
                )}
              >
                <Plus className="size-3.5" />
              </span>
            </button>
            {isOpen ? (
              <p className="px-4 pb-4 text-[14.5px] leading-relaxed text-muted animate-fade-in">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function KeyValue({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 text-[15px]", className)}>
      <span className="text-muted">{label}</span>
      <span className="text-end font-medium text-charcoal">{value}</span>
    </div>
  );
}
