import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-terracotta text-white shadow-[0_8px_20px_-10px_rgba(198,93,58,0.7)] hover:bg-terracotta-600",
        secondary:
          "border border-line bg-white text-charcoal shadow-sm hover:border-line-strong hover:bg-cream/60",
        olive:
          "bg-olive text-white shadow-[0_8px_20px_-10px_rgba(105,118,83,0.7)] hover:bg-olive-600",
        soft: "bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100",
        ghost: "text-charcoal hover:bg-cream-100",
        outline:
          "border border-charcoal/15 bg-transparent text-charcoal hover:border-charcoal/30 hover:bg-white/60",
        destructive: "bg-[#b3402f] text-white hover:bg-[#9c3526]",
        link: "rounded-none text-terracotta underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-[15px] [&_svg]:size-4",
        default: "h-11 px-4 [&_svg]:size-4",
        lg: "h-12 px-5 text-[17px] [&_svg]:size-[18px]",
        xl: "h-14 px-6 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
