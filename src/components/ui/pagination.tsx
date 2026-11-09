"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  onPage,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-6 flex items-center justify-center gap-1.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="grid size-9 place-items-center rounded-full border border-line bg-white text-charcoal transition hover:border-line-strong disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </button>
      {start > 1 ? (
        <>
          <button
            type="button"
            onClick={() => onPage(1)}
            className="grid size-9 place-items-center rounded-full border border-line bg-white text-[13px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            1
          </button>
          {start > 2 ? (
            <span className="px-1 text-muted-soft">…</span>
          ) : null}
        </>
      ) : null}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          className={cn(
            "grid size-9 place-items-center rounded-full border text-[13px] font-semibold transition",
            p === page
              ? "border-terracotta bg-terracotta text-white"
              : "border-line bg-white text-charcoal hover:border-line-strong",
          )}
        >
          {p}
        </button>
      ))}
      {end < totalPages ? (
        <>
          {end < totalPages - 1 ? (
            <span className="px-1 text-muted-soft">…</span>
          ) : null}
          <button
            type="button"
            onClick={() => onPage(totalPages)}
            className="grid size-9 place-items-center rounded-full border border-line bg-white text-[13px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            {totalPages}
          </button>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="grid size-9 place-items-center rounded-full border border-line bg-white text-charcoal transition hover:border-line-strong disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}
