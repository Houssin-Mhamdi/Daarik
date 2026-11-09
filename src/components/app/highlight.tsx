"use client";

import { useMemo } from "react";


export function Highlight({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const q = query.trim();
  const parts = useMemo(() => {
    if (!q) return [text];
    const lower = text.toLowerCase();
    const needle = q.toLowerCase();
    const result: (string | { match: string })[] = [];
    let cursor = 0;
    let idx = lower.indexOf(needle, cursor);
    while (idx !== -1) {
      if (idx > cursor) result.push(text.slice(cursor, idx));
      result.push({ match: text.slice(idx, idx + needle.length) });
      cursor = idx + needle.length;
      idx = lower.indexOf(needle, cursor);
    }
    if (cursor < text.length) result.push(text.slice(cursor));
    return result;
  }, [text, q]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <mark
            key={i}
            className="rounded bg-terracotta/20 px-0.5 font-semibold text-terracotta-700"
          >
            {part.match}
          </mark>
        ),
      )}
    </span>
  );
}
