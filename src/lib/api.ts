export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const TOKEN_STORAGE = {
  access: "darna.accessToken",
  refresh: "darna.refreshToken",
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE.access);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE.access, accessToken);
  window.localStorage.setItem(TOKEN_STORAGE.refresh, refreshToken);
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE.access);
  window.localStorage.removeItem(TOKEN_STORAGE.refresh);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const err = new Error(errorBody.message || `API Error ${res.status}`) as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = errorBody;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const darnaApi = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      city?: string;
      preferredLang?: "nl" | "en" | "ar";
      role?: "CUSTOMER" | "COOK";
    }) =>
      apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(body) },
      ),
    login: (body: { email: string; password: string }) =>
      apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(body) },
      ),
    refresh: (refreshToken: string) =>
      apiRequest<{ accessToken: string; refreshToken: string }>(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
      ),
    logout: () => apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" }),
    me: () => apiRequest<unknown>("/auth/me"),
  },
  cooks: {
    list: (params?: { city?: string; cuisine?: string; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [string, string][],
      ).toString();
      return apiRequest<unknown[]>(`/cooks${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiRequest<unknown>(`/cooks/${id}`),
    apply: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/cooks/apply", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    myDashboard: () => apiRequest<unknown>("/cooks/me/dashboard"),
    myAvailability: () => apiRequest<unknown>("/cooks/me/availability"),
    updateAvailability: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/cooks/me/availability", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    myEarnings: () => apiRequest<unknown>("/cooks/me/earnings"),
  },
  dishes: {
    list: (params?: Record<string, string>) => {
      const qs = new URLSearchParams(params ?? {}).toString();
      return apiRequest<unknown[]>(`/dishes${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiRequest<unknown>(`/dishes/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/dishes", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest<unknown>(`/dishes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiRequest<unknown>(`/dishes/${id}`, { method: "DELETE" }),
    report: (id: string, reason: string) =>
      apiRequest<unknown>(`/dishes/${id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },
  cart: {
    get: () => apiRequest<unknown>("/cart"),
    addItem: (body: { dishId: string; qty?: number; replace?: boolean }) =>
      apiRequest<unknown>("/cart/items", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    replace: (body: { dishId: string; qty?: number }) =>
      apiRequest<unknown>("/cart/replace", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateQty: (dishId: string, qty: number) =>
      apiRequest<unknown>(`/cart/items/${dishId}`, {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      }),
    clear: () => apiRequest<unknown>("/cart", { method: "DELETE" }),
  },
  orders: {
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    myOrders: () => apiRequest<unknown[]>("/orders"),
    get: (id: string) => apiRequest<unknown>(`/orders/${id}`),
    cancel: (id: string) =>
      apiRequest<unknown>(`/orders/${id}/cancel`, { method: "POST" }),
    cookOrders: (status?: string) =>
      apiRequest<unknown[]>(`/orders/cook/me${status ? `?status=${status}` : ""}`),
    updateStatus: (id: string, status: string) =>
      apiRequest<unknown>(`/orders/cook/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  reviews: {
    list: (params?: { cookId?: string; dishId?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [string, string][],
      ).toString();
      return apiRequest<unknown[]>(`/reviews${qs ? `?${qs}` : ""}`);
    },
    create: (body: {
      cookId: string;
      dishId?: string;
      orderId?: string;
      rating: number;
      text: string;
    }) =>
      apiRequest<unknown>("/reviews", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  payments: {
    config: () => apiRequest<unknown>("/payments/config"),
    createIntent: (body: {
      amount: number;
      cookId: string;
      paymentMethod: "ideal" | "card" | "bancontact";
      idealBank?: string;
      items?: { dishId: string; qty: number }[];
    }) =>
      apiRequest<{
        paymentIntentId: string;
        clientSecret: string;
        publishableKey: string;
        status: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        idealBank: string | null;
        payoutRouting: "STRIPE_CONNECT" | "BANK_TRANSFER";
        breakdown: {
          subtotal: number;
          serviceFee: number;
          commission: number;
          cookNet: number;
          cookPayoutDestination: string;
        };
      }>("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getCookPayoutSettings: () =>
      apiRequest<{
        cookId: string;
        name: string;
        payoutPreference: "STRIPE" | "BANK_TRANSFER";
        stripeAccountId: string | null;
        stripeOnboarded: boolean;
        walletBalance: number;
        iban: string | null;
        accountHolder: string | null;
        payoutDay: string;
        explanation: string;
      }>("/payments/cook/payout-settings"),
    connectCookStripe: (body: { stripeAccountId?: string }) =>
      apiRequest<{
        cookId: string;
        stripeAccountId: string;
        stripeOnboarded: boolean;
        payoutPreference: string;
        onboardingUrl: string | null;
      }>("/payments/cook/connect-stripe", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateCookPayoutSettings: (body: {
      payoutPreference: "STRIPE" | "BANK_TRANSFER";
      iban?: string;
      accountHolder?: string;
      stripeAccountId?: string;
    }) =>
      apiRequest<unknown>("/payments/cook/payout-settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    requestBankTransfer: () =>
      apiRequest<{ payout: unknown; message: string }>(
        "/payments/cook/request-bank-transfer",
        { method: "POST" },
      ),
  },
  admin: {
    overview: (range?: "30d" | "90d") =>
      apiRequest<unknown>(`/admin/overview${range ? `?range=${range}` : ""}`),
    orders: (params?: { status?: string; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [string, string][],
      ).toString();
      return apiRequest<unknown[]>(`/admin/orders${qs ? `?${qs}` : ""}`);
    },
    cooks: () => apiRequest<unknown>("/admin/cooks"),
    dishes: () => apiRequest<unknown[]>("/admin/dishes"),
    payouts: () => apiRequest<unknown[]>("/admin/payouts"),
    disputes: () => apiRequest<unknown[]>("/admin/disputes"),
    settings: () => apiRequest<unknown>("/admin/settings"),
  },
};
