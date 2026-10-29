"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/cook/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/cook/orders", key: "orders", icon: ClipboardList },
  { href: "/cook/dishes", key: "dishes", icon: UtensilsCrossed },
  { href: "/cook/availability", key: "availability", icon: CalendarDays },
  { href: "/cook/earnings", key: "earnings", icon: Wallet },
  { href: "/cook/profile", key: "profile", icon: Store },
] as const;

export function CookSidebar() {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[248px] flex-col border-e border-line/80 bg-white/70 backdrop-blur-xl md:flex">
      <div className="flex h-[76px] items-center px-6">
        <Logo href="/cook/dashboard" />
      </div>

      <div className="mx-4 flex items-center gap-3 rounded-2xl border border-line bg-cream/70 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/cook-rana.jpg"
          alt="Rana"
          className="size-10 rounded-full object-cover ring-2 ring-white"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-charcoal">
            Rana&apos;s kitchen
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
            <span className="size-1.5 rounded-full bg-olive" />
            {t("kitchenOpen")}
          </p>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 px-3">
        <p className="mb-2 px-3 text-[11.5px] font-bold uppercase tracking-[0.2em] text-muted-soft">
          {t("cookApp")}
        </p>
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition",
                active
                  ? "bg-terracotta-50 text-terracotta-700"
                  : "text-muted hover:bg-cream-100/70 hover:text-charcoal",
              )}
            >
              <Icon
                className={cn("size-[18px]", active && "text-terracotta")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {t(item.key)}
            </Link>
          );
        })}

        <p className="mb-2 mt-6 px-3 text-[11.5px] font-bold uppercase tracking-[0.2em] text-muted-soft">
          {t("support")}
        </p>
        <Link
          href="/help"
          className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted transition hover:bg-cream-100/70 hover:text-charcoal"
        >
          <HelpCircle className="size-[18px]" />
          {t("help")}
        </Link>
        <Link
          href="/cook/profile"
          className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted transition hover:bg-cream-100/70 hover:text-charcoal"
        >
          <Settings className="size-[18px]" />
          {t("settings")}
        </Link>
      </nav>

      <div className="space-y-2 border-t border-line/80 p-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-[14px] font-semibold text-muted transition hover:text-charcoal"
        >
          <ArrowLeftRight className="size-4" />
          {t("switchToCustomer")}
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-[14px] font-semibold text-muted transition hover:text-charcoal"
        >
          <LogOut className="size-4" />
          {t("signOut")}
        </Link>
      </div>
    </aside>
  );
}
