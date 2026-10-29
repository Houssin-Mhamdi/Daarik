"use client";

import {
  CheckCircle2,
  ChefHat,
  Clock3,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-provider";
import type { OrderStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

const meta: Record<
  OrderStatus,
  {
    key: string;
    variant: "soft" | "saffron" | "olive" | "success" | "destructive";
    icon: typeof Clock3;
  }
> = {
  confirmed: { key: "statusConfirmed", variant: "soft", icon: CheckCircle2 },
  preparing: { key: "statusPreparing", variant: "saffron", icon: ChefHat },
  ready: { key: "statusReady", variant: "olive", icon: PackageCheck },
  completed: { key: "statusCompleted", variant: "success", icon: CheckCircle2 },
  cancelled: { key: "statusCancelled", variant: "destructive", icon: XCircle },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { t } = useApp();
  const item = meta[status];
  const Icon = item.icon;
  return (
    <Badge variant={item.variant} className={cn("gap-1", className)}>
      <Icon className="size-3" />
      {t(item.key)}
    </Badge>
  );
}

export function StatusDot({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        status === "cancelled"
          ? "bg-[#b3402f]"
          : status === "completed"
            ? "bg-olive"
            : status === "ready"
              ? "bg-olive"
              : status === "preparing"
                ? "bg-saffron"
                : "bg-terracotta",
      )}
    />
  );
}
