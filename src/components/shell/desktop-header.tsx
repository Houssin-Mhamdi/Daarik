"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Globe2,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";
import { LanguageSheet } from "@/components/app/language-sheet";
import { NotificationsSheet } from "@/components/app/notifications-sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", key: "home" },
  { href: "/explore", key: "explore" },
  { href: "/favorites", key: "favorites" },
  { href: "/orders", key: "orders" },
] as const;

export function DesktopHeader() {
  const pathname = usePathname();
  const { t, cartCount, lang } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 hidden border-b border-line/70 bg-cream/88 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-7 px-6">
          <Logo />

          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[15.5px] font-semibold transition-colors",
                    active
                      ? "text-charcoal"
                      : "text-muted hover:text-charcoal",
                  )}
                >
                  {t(link.key)}
                  {active ? (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-terracotta" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <Link
              href="/explore"
              className="group flex h-10 w-56 items-center gap-2.5 rounded-full border border-line bg-white px-4 text-[14.5px] text-muted transition hover:border-line-strong"
            >
              <Search className="size-4 text-muted-soft" />
              <span className="truncate">{t("searchShort")}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLangOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[14px] font-semibold text-charcoal transition hover:border-line-strong"
              aria-label={t("languageSwitch")}
            >
              <Globe2 className="size-4 text-muted" />
              {lang.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative grid size-10 place-items-center rounded-full border border-line bg-white text-charcoal transition hover:border-line-strong"
              aria-label={t("notifications")}
            >
              <Bell className="size-[18px]" />
              <span className="absolute end-2 top-2 size-1.5 rounded-full bg-terracotta" />
            </button>

            <Link
              href="/cart"
              className="relative grid size-10 place-items-center rounded-full border border-line bg-white text-charcoal transition hover:border-line-strong"
              aria-label={t("cart")}
            >
              <ShoppingBag className="size-[18px]" />
              {cartCount > 0 ? (
                <span className="absolute -end-1 -top-1 grid size-[18px] place-items-center rounded-full bg-terracotta text-[12px] font-bold text-white ring-2 ring-cream">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cook"
              className="flex h-10 items-center gap-1.5 rounded-full bg-olive-50 px-3.5 text-[14.5px] font-semibold text-olive-600 transition hover:bg-olive-100"
            >
              <Sparkles className="size-3.5" />
              {t("becomeCookCta")}
            </Link>

            <Link
              href="/profile"
              className="ms-1 flex items-center gap-2 rounded-full border border-line bg-white py-1 pe-2.5 ps-1 transition hover:border-line-strong"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/user-sarah.jpg"
                alt="Sarah"
                className="size-8 rounded-full object-cover"
              />
              <ChevronDown className="size-3.5 text-muted" />
            </Link>
          </div>
        </div>
      </header>
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <NotificationsSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}
