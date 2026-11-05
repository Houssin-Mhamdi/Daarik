"use client";

import { useEffect, useState } from "react";

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setHasHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return hasHydrated;
}

export function getSafeNextPath(search: string): string | null {
  const requested = new URLSearchParams(search).get("next");
  if (!requested) return null;

  try {
    const origin = "http://darna.local";
    const target = new URL(requested, origin);
    if (target.origin !== origin) return null;
    if (target.pathname === "/login" || target.pathname === "/register") {
      return null;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function getAuthenticatedHome(role?: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "COOK") return "/cook/dashboard";
  return "/profile";
}
