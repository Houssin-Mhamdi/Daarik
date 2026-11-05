"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";

export function SignOutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, toast, logout } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
      onClose();
      toast(t("signOut"), { variant: "info" });
      router.replace("/");
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => void confirm()}
      title={t("signOutTitle")}
      description={t("signOutDesc")}
      confirmLabel={t("signOut")}
      cancelLabel={t("cancel")}
      icon={<LogOut className="size-5" />}
      loading={loading}
    />
  );
}
