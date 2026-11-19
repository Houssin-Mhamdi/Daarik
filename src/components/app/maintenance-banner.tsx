"use client";

import { Wrench } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { useCatalogQuery } from "@/lib/queries";

export function MaintenanceBanner() {
  const { t } = useApp();
  const { data: catalog } = useCatalogQuery();

  if (!catalog?.maintenanceMode) return null;

  return (
    <div
      role="status"
      className="flex w-full items-center justify-center gap-2 bg-charcoal px-4 py-2 text-center text-[13px] font-medium text-cream"
    >
      <Wrench className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span>{t("maintenanceBanner")}</span>
    </div>
  );
}
