"use client";

import { useEffect } from "react";

/**
 * Registers the push-only service worker for every visitor. It asks for no
 * permission and caches nothing; the subscription is opt-in from cook settings.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Browsers refuse registration on insecure origins; the catch keeps the
    // rest of the app unaffected.
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
