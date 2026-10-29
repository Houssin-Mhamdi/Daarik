"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DishWizard } from "@/components/cook/dish-wizard";
import { useApp } from "@/components/providers/app-provider";
import { getDish } from "@/lib/data";

export default function EditDishPage() {
  const params = useParams<{ id: string }>();
  const { t } = useApp();
  const dish = getDish(params.id);

  if (!dish || dish.cookId !== "rana") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[480px] flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[26px] font-semibold text-charcoal">
          {t("dishNotFound")}
        </p>
        <Link
          href="/cook/dishes"
          className="mt-4 flex h-11 items-center gap-2 rounded-full bg-terracotta px-5 text-[14.5px] font-semibold text-white"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("myDishes")}
        </Link>
      </div>
    );
  }

  return <DishWizard dish={dish} />;
}
