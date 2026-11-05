"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";

export function AuthRequiredSheet({
  open,
  onClose,
  nextPath,
}: {
  open: boolean;
  onClose: () => void;
  nextPath: string;
}) {
  const { t } = useApp();
  const safeNextPath =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const next = encodeURIComponent(safeNextPath);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("authRequiredTitle")}
      description={t("authRequiredDescription")}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/login?next=${next}`}
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-full bg-terracotta px-4 text-sm font-semibold text-white"
          >
            {t("authSignIn")}
          </Link>
          <Link
            href={`/register?next=${next}`}
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-charcoal"
          >
            {t("authCreateAccount")}
          </Link>
        </div>
      }
    >
      <div />
    </Sheet>
  );
}
