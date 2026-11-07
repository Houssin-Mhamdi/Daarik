"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { loc, type Cook } from "@/lib/data";
import { ClosedPill } from "./kitchen-status";
import { EmptyNotice } from "./empty-notice";

export function TopCooksList({ cooks }: { cooks: Cook[] }) {
  const { lang } = useApp();

  if (cooks.length === 0) return <EmptyNotice />;

  return (
    <>
      {cooks.map((cook) => (
        <Link
          key={cook.id}
          href={`/cook/${cook.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card transition hover:border-line-strong"
        >
          <Image
            src={cook.avatar || "/img/daarik-logo.png"}
            alt={cook.name}
            width={48}
            height={48}
            loading="lazy"
            unoptimized
            className="size-12 rounded-full object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[14.5px] font-semibold text-charcoal">
              {cook.name}
              <BadgeCheck className="size-3.5 fill-olive text-white" />
              {cook.kitchenOpen === false ? <ClosedPill /> : null}
            </span>
            <span className="block truncate text-[12.5px] text-muted">
              {loc(cook.specialties, lang)}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
              <Star className="size-2.5 fill-saffron text-saffron" />
              {cook.rating.toFixed(1)} · {cook.area[lang]}
            </span>
          </span>
          <ArrowRight className="size-4 text-muted-soft transition group-hover:text-terracotta rtl:rotate-180" />
        </Link>
      ))}
    </>
  );
}
