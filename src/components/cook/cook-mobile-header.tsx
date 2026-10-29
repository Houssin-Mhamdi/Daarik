"use client";

import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

export function CookMobileHeader({
  title,
  subtitle,
  action,
  showAvatar = true,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  showAvatar?: boolean;
  className?: string;
}) {
  const { t } = useApp();

  return (
    <header
      className={cn(
        "flex items-center gap-3 pb-1 pt-[max(8px,env(safe-area-inset-top,0px))] md:hidden",
        className,
      )}
    >
      {showAvatar ? (
        <Link href="/cook/profile" className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/cook-rana.jpg"
            alt="Rana"
            className="size-10 rounded-full object-cover ring-2 ring-white"
          />
          <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 border-cream bg-olive" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold leading-tight text-charcoal">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-muted">
            {subtitle}
            <ChevronDown className="size-3" />
          </p>
        ) : null}
      </div>
      {action ?? (
        <button
          type="button"
          aria-label={t("notifications")}
          className="relative grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-charcoal"
        >
          <Bell className="size-4" />
          <span className="absolute end-2 top-2 size-1.5 rounded-full bg-terracotta" />
        </button>
      )}
    </header>
  );
}
