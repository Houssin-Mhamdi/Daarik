"use client";

import { Star } from "lucide-react";
import { loc, type Review } from "@/lib/data";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

export function ReviewCard({
  review,
  compact,
  className,
}: {
  review: Review;
  compact?: boolean;
  className?: string;
}) {
  const { lang } = useApp();
  return (
    <article
      className={cn(
        "rounded-2xl border border-line/80 bg-white p-4 shadow-card",
        compact && "p-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-olive-50 text-[12px] font-bold text-olive-600">
          {review.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-charcoal">
            {review.author}
          </p>
          <p className="text-[12px] text-muted-soft">{loc(review.date, lang)}</p>
        </div>
        <span className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "size-2.5",
                star <= review.rating
                  ? "fill-saffron text-saffron"
                  : "fill-transparent text-line-strong",
              )}
            />
          ))}
        </span>
      </div>
      <p className="mt-2.5 text-[14px] leading-relaxed text-charcoal-soft">
        {loc(review.text, lang)}
      </p>
    </article>
  );
}
