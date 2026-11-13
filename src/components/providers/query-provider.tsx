"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== "darna.session" &&
        event.key !== null
      ) {
        return;
      }

      void queryClient.cancelQueries().finally(() => {
        queryClient.clear();
        window.location.replace("/login");
      });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
