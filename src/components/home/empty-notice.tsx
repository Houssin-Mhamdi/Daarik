"use client";

import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

/** Shown wherever a home section has nothing for the chosen location. */
export function EmptyNotice({ className }: { className?: string }) {
  const { t } = useApp();
  return (
    <p
      className={cn(
        "rounded-2xl border border-line bg-white px-4 py-5 text-sm text-muted",
        className,
      )}
    >
      {t("noCooksAtLocation")}
    </p>
  );
}
