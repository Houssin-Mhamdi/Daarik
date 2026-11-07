"use client";

import { useEffect, useState } from "react";

/** Cycles an index every `intervalMs`, pausing while `paused` is true. */
export function useRotatingIndex(
  length: number,
  paused: boolean,
  intervalMs = 5000,
) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused || length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => current + 1),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [paused, length, intervalMs]);

  return length ? index % length : 0;
}
