"use client";

import { useCallback, useEffect, useState } from "react";
import { darnaApi } from "@/lib/api";

export type PushStatus = "loading" | "unsupported" | "denied" | "off" | "on";
export type PushResult = "enabled" | "disabled" | "unsupported" | "denied" | "failed";

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

/** Owns the browser subscription lifecycle; the API only stores opaque tokens. */
export function useWebPush() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    setStatus(subscription ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async (): Promise<PushResult> => {
    if (!isSupported()) {
      setStatus("unsupported");
      return "unsupported";
    }
    setBusy(true);
    try {
      // Must happen synchronously inside the user gesture.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return permission === "denied" ? "denied" : "failed";
      }

      const { publicKey, enabled } = await darnaApi.notifications.pushKey();
      if (!enabled || !publicKey) {
        setStatus("unsupported");
        return "unsupported";
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const details = subscription.toJSON();
      if (!details.endpoint || !details.keys?.p256dh || !details.keys?.auth) {
        throw new Error("Invalid push subscription");
      }
      await darnaApi.notifications.subscribe({
        endpoint: details.endpoint,
        keys: { p256dh: details.keys.p256dh, auth: details.keys.auth },
        userAgent: navigator.userAgent.slice(0, 300),
      });

      setStatus("on");
      return "enabled";
    } catch {
      setStatus("off");
      return "failed";
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<PushResult> => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Remove the server record first so a stale device can never be sent a
        // notification if the local unsubscribe fails.
        await darnaApi.notifications
          .unsubscribe(subscription.endpoint)
          .catch(() => undefined);
        await subscription.unsubscribe();
      }
      setStatus("off");
      return "disabled";
    } catch {
      return "failed";
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable, disable, refresh };
}
