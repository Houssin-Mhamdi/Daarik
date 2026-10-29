import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white px-4 text-[17px] text-charcoal shadow-[0_1px_2px_rgba(41,40,36,0.02)] outline-none transition placeholder:text-muted-soft/80 focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-[17px] leading-relaxed text-charcoal outline-none transition placeholder:text-muted-soft/80 focus:border-terracotta focus:ring-4 focus:ring-terracotta/10",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-2 block text-[15px] font-semibold tracking-[0.01em] text-charcoal",
        className,
      )}
      {...props}
    />
  );
}

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  optionalLabel?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  optionalLabel,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="ms-0.5 text-terracotta" aria-hidden>
              *
            </span>
          ) : optionalLabel ? (
            <span className="ms-1 font-normal text-muted-soft">
              ({optionalLabel})
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#b3402f]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-line bg-white px-4 pe-10 text-[17px] text-charcoal outline-none transition focus:border-terracotta focus:ring-4 focus:ring-terracotta/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
