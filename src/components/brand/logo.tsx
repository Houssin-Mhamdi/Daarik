import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Daarik home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-terracotta shadow-[0_6px_16px_-8px_rgba(198,93,58,0.9)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/daarik-logo.png"
          alt="Daarik"
          className="size-full object-cover"
        />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block font-display text-[23px] font-semibold tracking-[-0.03em] text-charcoal">
            Daarik
          </span>
          <span className="mt-0.5 block font-arabic text-[11.5px] uppercase leading-none tracking-[0.22em] text-terracotta">
            دارك
          </span>
        </span>
      ) : null}
    </Link>
  );
}
