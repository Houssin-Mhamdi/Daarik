"use client";

import Link from "next/link";
import { Bell, ChevronDown, MapPin, UserRound } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

const iconButton =
  "grid size-10 place-items-center rounded-full border border-line bg-white/80 text-charcoal shadow-sm backdrop-blur";

export function MobileHeader({
  city,
  unread,
  onCity,
  onLanguage,
  onNotifications,
}: {
  city: string;
  unread: number;
  onCity: () => void;
  onLanguage: () => void;
  onNotifications: () => void;
}) {
  const { t, lang, isAuthenticated, user } = useApp();

  return (
    <div className="flex items-center justify-between px-4 pb-1 pt-[max(10px,env(safe-area-inset-top,0px))]">
      <button
        type="button"
        onClick={onCity}
        className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 text-[14px] font-semibold text-charcoal shadow-sm backdrop-blur"
      >
        <MapPin className="size-3.5 text-terracotta" />
        {city || t("allNetherlands")}
        <ChevronDown className="size-3 text-muted" />
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLanguage}
          className={`${iconButton} text-[12.5px] font-bold`}
          aria-label={t("languageSwitch")}
        >
          {lang.toUpperCase()}
        </button>
        <button
          type="button"
          onClick={onNotifications}
          className={`${iconButton} relative`}
          aria-label={t("notifications")}
        >
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute end-2.5 top-2.5 size-1.5 rounded-full bg-terracotta ring-2 ring-white" />
          ) : null}
        </button>
        {isAuthenticated ? (
          <Link
            href="/profile"
            aria-label={t("profile")}
            className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-white bg-terracotta text-[14px] font-bold text-white shadow-sm"
          >
            {(user.firstName || user.name || "U").slice(0, 1).toUpperCase()}
          </Link>
        ) : (
          <Link href="/login" aria-label={t("signIn")} className={iconButton}>
            <UserRound className="size-[18px]" />
          </Link>
        )}
      </div>
    </div>
  );
}
