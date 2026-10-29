"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Megaphone, Sparkles, Truck } from "lucide-react";
import { Sheet } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { notifications } from "@/lib/data";
import { loc } from "@/lib/data";
import { cn } from "@/lib/utils";

const icons = [Truck, Sparkles, Megaphone];

export function NotificationsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang, t } = useApp();
  const [read, setRead] = useState<string[]>([]);
  const unread = notifications.filter((n) => n.unread && !read.includes(n.id));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("notifications")}
      description={t("notificationsSub")}
      footer={
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setRead(notifications.map((n) => n.id))}
          disabled={unread.length === 0}
        >
          <CheckCheck className="size-4" />
          {t("markAllRead")}
        </Button>
      }
    >
      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {t("notificationEmpty")}
        </p>
      ) : (
        <ul className="space-y-2 pb-1">
          {notifications.map((item, index) => {
            const Icon = icons[index % icons.length];
            const isUnread = item.unread && !read.includes(item.id);
            return (
              <li key={item.id}>
                <Link
                  href="/orders"
                  onClick={() => {
                    setRead((prev) =>
                      prev.includes(item.id) ? prev : [...prev, item.id],
                    );
                    onClose();
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3.5 transition",
                    isUnread
                      ? "border-terracotta/25 bg-terracotta-50/45"
                      : "border-line bg-white hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      isUnread
                        ? "bg-terracotta text-white"
                        : "bg-cream-100 text-charcoal",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[15px] font-semibold leading-snug text-charcoal">
                        {loc(item.title, lang)}
                      </span>
                      <span className="shrink-0 pt-0.5 text-[12px] text-muted-soft">
                        {loc(item.time, lang)}
                      </span>
                    </span>
                    <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">
                      {loc(item.body, lang)}
                    </span>
                  </span>
                  {isUnread ? (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted-soft">
        <Bell className="size-3" />
        {t("viewAllNotifications")}
      </div>
    </Sheet>
  );
}
