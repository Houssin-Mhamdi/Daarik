"use client";

import { useCatalogQuery } from "@/lib/queries";
import { useApp } from "@/components/providers/app-provider";

export function MaintenanceBanner() {
  const { data: catalog } = useCatalogQuery();
  if (!catalog?.maintenanceMode) return null;
  return (
    <div className="w-full bg-charcoal px-4 py-2 text-center text-[13px] font-semibold text-cream">
      🛠️ Daarik is undergoing maintenance. Some features may be unavailable.
    </div>
  );
}
