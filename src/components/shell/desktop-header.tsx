"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChefHat,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
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
  const router = useRouter();
  const { t, cartCount, lang, isAuthenticated, user, logout } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

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

            {isAuthenticated ? (
              <div ref={menuRef} className="relative ms-1">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pe-3 ps-1.5 transition hover:border-line-strong"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-terracotta text-[13px] font-bold text-white">
                    {(user.firstName || user.name || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <span className="max-w-[130px] truncate text-[13.5px] font-semibold text-charcoal">
                    {user.firstName || user.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted transition-transform",
                      userMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {userMenuOpen ? (
                  <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift">
                    <div className="border-b border-line/70 px-3 py-2.5">
                      <p className="truncate text-[14px] font-semibold text-charcoal">
                        {user.name || user.firstName}
                      </p>
                      <p className="truncate text-[12px] text-muted">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/cook/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-terracotta transition hover:bg-terracotta-50/70"
                      >
                        <ChefHat className="size-4" />
                        {t("cookDashboard")}
                      </Link>
                      <Link
                        href="/cook/dishes/new"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-charcoal transition hover:bg-cream"
                      >
                        <Plus className="size-4 text-muted" />
                        {t("addNewDish")}
                      </Link>
                      {user.role === "ADMIN" ? (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-olive-700 transition hover:bg-olive-50"
                        >
                          <ShieldCheck className="size-4" />
                          {t("adminApp")}
                        </Link>
                      ) : null}
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-charcoal transition hover:bg-cream"
                      >
                        <Package className="size-4 text-muted" />
                        {t("myOrders")}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-charcoal transition hover:bg-cream"
                      >
                        <LayoutDashboard className="size-4 text-muted" />
                        {t("profile")}
                      </Link>
                    </div>

                    <div className="border-t border-line/70 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem(
                              "darna.cookApplicationEmail",
                            );
                          }
                          void logout().then(() => router.push("/login"));
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13.5px] font-semibold text-[#a13a28] transition hover:bg-[#fdf1ec]"
                      >
                        <LogOut className="size-4" />
                        {t("signOut")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="ms-1 flex h-10 items-center gap-1.5 rounded-full bg-terracotta px-4 text-[14px] font-semibold text-white transition hover:bg-terracotta-600"
              >
                <UserRound className="size-4" />
                {t("signIn")}
              </Link>
            )}
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
