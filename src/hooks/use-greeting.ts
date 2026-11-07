"use client";

import { useEffect, useState } from "react";

export type GreetingKey =
  | "greetingMorning"
  | "greetingAfternoon"
  | "greetingEvening";

/** Time-of-day greeting key, resolved after mount to avoid hydration mismatch. */
export function useGreeting(): GreetingKey {
  const [greeting, setGreeting] = useState<GreetingKey>("greetingAfternoon");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hour = new Date().getHours();
      setGreeting(
        hour < 12
          ? "greetingMorning"
          : hour < 18
            ? "greetingAfternoon"
            : "greetingEvening",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return greeting;
}
