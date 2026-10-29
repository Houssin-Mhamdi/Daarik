"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChefHat,
  ClipboardList,
  Command,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { LanguageSheet } from "@/components/app/language-sheet";
import { Avatar } from "@/components/ui/controls";
import { useApp } from "@/components/providers/app-provider";
import { adminKpis } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const navGroups = [
  {
    label: "marketplace",
    items: [
      { href: "/admin", key: "adminNavDashboard", icon: LayoutDashboard },
      { href: "/admin/orders", key: "adminNavOrders", icon: ClipboardList },
      { href: "/admin/dishes", key: "adminNavDishes", icon: UtensilsCrossed },
    ],
  },
  {
    label: "people",
    items: [
      { href: "/admin/cooks", key: "adminNavCooks", icon: ChefHat },
      {
        href: "/admin/disputes",
        key: "adminNavDisputes",
        icon: ShieldAlert,
        count: adminKpis.disputes,
      },
    ],
  },
  {
    label: "finance",
    items: [
      { href: "/admin/payouts", key: "adminNavPayouts", icon: Wallet },
    ],
  },
  {
    label: "operations",
    items: [
      { href: "/admin/settings", key: "adminNavSettings", icon: Settings },
    ],
  },
] as {
  label: string;
  items: { href: string; key: string; icon: LucideIcon; count?: number }[];
}[];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState("");

  const activeItem = navGroups
    .flatMap((group) => group.items)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
    );
  const title = activeItem ? t(activeItem.key) : t("adminOverview");

  return (
    <div className="min-h-dvh bg-[#f4efe6]">
      {/* Mobile / tablet drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label={t("close")}
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-charcoal/45 backdrop-blur-[2px] transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 start-0 flex w-[268px] flex-col bg-[#232220] text-cream shadow-2xl transition-transform duration-300",
            menuOpen
              ? "translate-x-0"
              : "ltr:-translate-x-full rtl:translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <AdminLogo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t("close")}
              className="grid size-9 place-items-center rounded-full text-cream/70 transition hover:bg-white/10 hover:text-cream"
            >
              <X className="size-4.5" />
            </button>
          </div>
          <SidebarNav pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[260px] flex-col bg-[#232220] text-cream lg:flex">
        <div className="flex h-[72px] items-center px-6">
          <AdminLogo />
        </div>
        <SidebarNav pathname={pathname} />
      </aside>

      <div className="lg:ps-[260px]">
        <header className="sticky top-0 z-30 border-b border-[#e7dfd1] bg-[#f4efe6]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("adminNavDashboard")}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e4dbc9] bg-white text-charcoal lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="hidden text-[12px] font-bold uppercase tracking-[0.18em] text-muted-soft md:block">
                {t("adminApp")} · {t("adminTitle")}
              </p>
              <h1 className="truncate text-[17px] font-semibold text-charcoal md:mt-0.5 md:text-[19px]">
                {title}
              </h1>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!query.trim()) return;
                router.push(`/admin/orders?q=${encodeURIComponent(query.trim())}`);
              }}
              className="relative hidden w-[300px] xl:block"
            >
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchAdmin")}
                aria-label={t("searchAdmin")}
                className="h-10 w-full rounded-xl border border-[#e4dbc9] bg-white ps-9 pe-12 text-[14.5px] text-charcoal outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:ring-4 focus:ring-terracotta/10"
              />
              <span className="pointer-events-none absolute end-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-line bg-cream px-1.5 py-0.5 text-[11.5px] font-semibold text-muted-soft">
                <Command className="size-2.5" />K
              </span>
            </form>

            <div className="ms-auto flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={() => setLangOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-2.5 text-[13px] font-bold text-charcoal transition hover:border-line-strong"
                aria-label={t("languageSwitch")}
              >
                <Globe2 className="size-3.5 text-muted" />
                {lang.toUpperCase()}
              </button>
              <Link
                href="/"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong md:flex"
              >
                <ExternalLink className="size-3.5 text-muted" />
                {t("switchToCustomer")}
              </Link>
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-full border border-[#e4dbc9] bg-white text-charcoal transition hover:border-line-strong"
                aria-label={t("notifications")}
              >
                <Bell className="size-4" />
                <span className="absolute end-2 top-2 size-1.5 rounded-full bg-terracotta ring-2 ring-white" />
              </button>
              <div className="ms-1 flex items-center gap-2 border-s border-[#e4dbc9] ps-2">
                <Avatar src="/img/user-sarah.jpg" alt="Admin" size={32} />
                <div className="hidden leading-tight xl:block">
                  <p className="text-[13.5px] font-semibold text-charcoal">Sarah de Vries</p>
                  <p className="text-[12px] text-muted">{t("adminApp")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-10 pt-5 md:px-6 md:pt-7 lg:px-8">{children}</main>

        <footer className="flex flex-col gap-1 px-4 pb-8 text-[12.5px] text-muted-soft md:flex-row md:items-center md:justify-between md:px-8">
          <span>{t("adminFooterNote")}</span>
          <span>
            {t("buildVersion")} 1.4.0 · {t("region")} NL
          </span>
        </footer>
      </div>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </div>
  );
}

function AdminLogo() {
  const { t } = useApp();
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-[12px] bg-terracotta">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/daarik-logo.png"
          alt="Daarik"
          className="size-full object-cover"
        />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[21px] font-semibold tracking-[-0.03em] text-cream">
          Daarik
        </span>
        <span className="mt-1 block text-[10px] font-bold uppercase leading-none tracking-[0.22em] text-terracotta">
          {t("adminApp")}
        </span>
      </span>
    </Link>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useApp();
  return (
    <>
      <nav className="mt-1 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream/35">
              {t(group.label)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-medium transition",
                      active
                        ? "bg-cream/10 text-cream"
                        : "text-cream/55 hover:bg-white/5 hover:text-cream/90",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[17px]",
                        active ? "text-terracotta" : "text-cream/40 group-hover:text-cream/70",
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span className="flex-1">{t(item.key)}</span>
                    {"count" in item && item.count ? (
                      <span className="rounded-full bg-terracotta px-1.5 py-0.5 text-[11.5px] font-bold text-white">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#9db879]" />
          <p className="text-[12.5px] font-semibold text-cream/80">{t("allSystemsOk")}</p>
        </div>
        <p className="mt-1 text-[12px] text-cream/40">
          {t("liveKitchens")}: 184 · 99.98% {t("uptime").toLowerCase()}
        </p>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar src="/img/user-sarah.jpg" alt="Sarah" size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13.5px] font-semibold text-cream">Sarah de Vries</p>
            <p className="text-[11.5px] text-cream/40">sarah@darna.nl</p>
          </div>
          <Link
            href="/profile"
            onClick={onNavigate}
            aria-label={t("profile")}
            className="grid size-8 place-items-center rounded-lg text-cream/50 transition hover:bg-white/10 hover:text-cream"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
