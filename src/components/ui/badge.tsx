import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-cream-100 text-charcoal",
        terracotta: "bg-terracotta text-white",
        soft: "bg-terracotta-50 text-terracotta-700",
        olive: "bg-olive-50 text-olive-600",
        oliveSolid: "bg-olive text-white",
        saffron: "bg-saffron-50 text-[#8a5d13]",
        outline: "border border-line-strong bg-white/70 text-muted",
        success: "bg-[#eaf1e3] text-[#486338]",
        destructive: "bg-[#f9e3dd] text-[#a13a28]",
        glass: "bg-white/85 text-charcoal backdrop-blur-md",
        dark: "bg-charcoal/85 text-white backdrop-blur-md",
      },
      size: {
        sm: "px-2 py-1 text-[12px]",
        default: "px-2.5 py-1.5 text-[13px]",
        lg: "px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
