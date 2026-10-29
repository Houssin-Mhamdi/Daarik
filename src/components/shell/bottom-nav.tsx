"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Compass,
  Heart,
  Home,
  LayoutDashboard,
  ReceiptText,
  Store,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

const customerItems = [
  { href: "/", key: "home", icon: Home },
  { href: "/explore", key: "explore", icon: Compass },
  { href: "/favorites", key: "favorites", icon: Heart },
  { href: "/orders", key: "orders", icon: ReceiptText },
  { href: "/profile", key: "profile", icon: UserRound },
] as const;

const cookItems = [
  { href: "/cook/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/cook/orders", key: "orders", icon: ClipboardList },
  { href: "/cook/dishes", key: "dishes", icon: UtensilsCrossed },
  { href: "/cook/earnings", key: "earnings", icon: Wallet },
  { href: "/cook/profile", key: "profile", icon: Store },
] as const;

function isActive(pathname: string, href: string, home = false) {
  if (home) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ variant }: { variant: "customer" | "cook" }) {
  const pathname = usePathname();
  const { t } = useApp();
  const items = variant === "customer" ? customerItems : cookItems;

  return (
    <nav
      aria-label={variant === "customer" ? "Main navigation" : "Cook navigation"}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-cream/92 shadow-nav backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-[64px] max-w-[480px] grid-cols-5 px-1.5 pb-safe">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.key === "home");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl"
            >
              <span
                className={cn(
                  "relative grid h-8 w-12 place-items-center rounded-full transition-all duration-300",
                  active ? "bg-terracotta-50" : "bg-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "size-[21px] transition-colors",
                    active
                      ? "text-terracotta"
                      : "text-muted group-hover:text-charcoal",
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {active ? (
                  <span className="absolute -bottom-0.5 size-1 rounded-full bg-terracotta" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[12px] font-semibold leading-none tracking-[0.01em] transition-colors",
                  active ? "text-terracotta" : "text-muted",
                )}
              >
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
