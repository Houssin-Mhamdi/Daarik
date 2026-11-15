"use client";

import { useMemo, useState } from "react";
import { CITY_NAMES } from "@/lib/cities";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CityCombobox({
  value,
  onChange,
  placeholder = "Type a city...",
  className,
}: {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITY_NAMES.slice(0, 12);
    return CITY_NAMES.filter((name) =>
      name.toLowerCase().includes(q),
    ).slice(0, 12);
  }, [query]);

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="h-11 rounded-xl"
      />
      {open && filtered.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-line bg-white shadow-card">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(name);
                setQuery("");
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-start text-[14px] transition hover:bg-cream-100",
                value === name && "bg-terracotta-50 text-terracotta",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
