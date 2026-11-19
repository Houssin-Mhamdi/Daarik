"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/components/providers/app-provider";
import { API_BASE_URL, getAccessToken } from "@/lib/api";
import { queryKeys } from "@/lib/queries";

/** Shape of the privacy-safe `order.new` payload sent by the API. */
type CookOrderEvent = {
  code?: string;
  orderId?: string;
  totalCents?: number;
};

/**
 * Opens the cook's authenticated SSE stream and keeps the dashboard in sync.
 *
 * The stream only ever carries an order code/status/total — never customer
 * contact details or addresses. Reconnection is handled by EventSource; we only
 * close the stream when the session marker is gone so an expired cookie doesn't
 * cause an endless retry loop.
 */
export function useCookOrderNotifications(enabled: boolean): void {
  const queryClient = useQueryClient();
  const { isAuthenticated, user, t, toast } = useApp();

  useEffect(() => {
    if (!enabled || !isAuthenticated || user?.role !== "COOK") return;
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource(`${API_BASE_URL}/notifications/stream`, {
      withCredentials: true,
    });

    source.addEventListener("order.new", (event) => {
      let payload: CookOrderEvent = {};
      try {
        payload = JSON.parse((event as MessageEvent<string>).data) as CookOrderEvent;
      } catch {
        // Ignore malformed events; the next query invalidation still refreshes.
      }
      toast(
        `${t("newOrderNote")}${payload.code ? ` · ${payload.code}` : ""}`,
        { variant: "success" },
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.cookOrdersRoot,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cookDashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    });

    source.onerror = () => {
      // No local session marker means the user logged out in another tab; stop
      // instead of retrying a 401 forever.
      if (!getAccessToken()) source.close();
    };

    return () => source.close();
  }, [enabled, isAuthenticated, user?.role, queryClient, t, toast]);
}
