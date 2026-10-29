import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("skeleton rounded-2xl", className)}
      aria-hidden
      {...props}
    />
  );
}

export function DishCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line/70 bg-white p-0 shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-3.5 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line/70 bg-white p-3">
      <Skeleton className="size-16 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-2/3 rounded-full" />
      </div>
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-5">
      <Skeleton className="h-7 w-40 rounded-full" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3.5">
        <DishCardSkeleton />
        <DishCardSkeleton />
      </div>
    </div>
  );
}
