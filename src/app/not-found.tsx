"use client";

import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { Container } from "@/components/ui/misc";

export default function NotFound() {
  const { t } = useApp();
  return (
    <Container className="flex min-h-[80dvh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-white text-terracotta shadow-card">
        <UtensilsCrossed className="size-8" />
      </span>
      <p className="mt-6 font-display text-[34px] leading-tight text-charcoal">
        {t("pageNotFoundTitle")}
      </p>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        {t("pageNotFoundSub")}
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("goHome")}
      </Link>
    </Container>
  );
}
