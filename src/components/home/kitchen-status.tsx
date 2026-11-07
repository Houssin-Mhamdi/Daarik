"use client";

import { Moon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

/** Top-left badge on featured cards: "Kitchen closed" overrides the label. */
export function FeaturedBadge({
  closed,
  label,
  iconClassName = "size-3",
}: {
  closed: boolean;
  label: string;
  iconClassName?: string;
}) {
  const { t } = useApp();
  return (
    <Badge variant="glass" size="sm">
      {closed ? (
        <Moon className={cn(iconClassName, "text-saffron")} />
      ) : (
        <Sparkles className={cn(iconClassName, "text-terracotta")} />
      )}
      {closed ? t("kitchenClosedBadge") : label}
    </Badge>
  );
}

/** Small amber pill used next to a cook's name. */
export function ClosedPill() {
  const { t } = useApp();
  return (
    <span className="ms-1 rounded-full bg-saffron/20 px-2 py-0.5 text-[10.5px] font-bold text-[#8a5d13]">
      {t("kitchenClosedBadge")}
    </span>
  );
}
