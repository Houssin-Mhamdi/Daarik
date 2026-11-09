import type { Localized, PickupOption } from "@/lib/data";

export type CatalogCuisine = {
  id: string;
  label: Localized;
  flag: string;
  image: string;
};
export type AuthUserRecord = {
  id: string;
  name: string;
  firstName?: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
  role: "CUSTOMER" | "COOK" | "ADMIN";
};
export type CookAvailabilityRecord = {
  kitchenOpen: boolean;
  maxPortionsPerDay: number;
  availableDays: string[];
  availableSlots: string[];
  pickupOptions: PickupOption[];
};
export type CookApplicationStatus = {
  id: string;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  submittedAt: string;
  reviewerNotes: string | null;
};
export type AdminOverviewResponse = {
  range: string;
  kpis: {
    gmv: number;
    commission: number;
    serviceFee: number;
    revenue: number;
    activeCooks: number;
    activeCustomers: number;
    ordersToday: number;
    pendingVerifications: number;
    disputes: number;
    avgOrder: number;
    refundRate: number;
    pendingTransfersCents: number;
  };
  revenueSeries: number[];
  weeklyOrders: number[];
  topCuisines: { name: string; orders: number; share: number }[];
  topCooks: unknown[];
  verificationQueue: {
    id: string;
    name: string;
    city: string;
    cuisine: string;
    submittedAt: string;
    documentsCount: number;
  }[];
  recentOrders: {
    id: string;
    code: string;
    customer: string;
    cook: string;
    amount: number;
    status: string;
    paymentStatus: string;
    pickup: string;
    placed: string;
  }[];
  payoutsSummary: { due: number; pendingCount: number };
};
export type AdminPayoutRecord = {
  id: string;
  dbId: string;
  stripePayoutId: string | null;
  cook: string;
  cookId: string;
  period: string;
  gross: number;
  commission: number;
  net: number;
  amount: number;
  ordersCount: number;
  status: string;
  automatic: boolean;
  arrivalDate: string | null;
  failureMessage: string | null;
  paidAt: string | null;
};
export type FavoriteRecord = { id: string; slug?: string };
export type UserNotification = {
  id: string;
  title: string | { nl: string; en: string; ar: string };
  body: string | { nl: string; en: string; ar: string };
  timeLabel: string | { nl: string; en: string; ar: string } | null;
  unread: boolean;
  createdAt: string;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** Payout readiness as mirrored from Stripe + Daarik's own compliance gate. */
export interface CookPayoutSettings {
  cookId: string;
  name: string;
  stripe: {
    connected: boolean;
    accountId: string | null;
    status:
      | "NONE"
      | "PENDING"
      | "REQUIREMENTS_DUE"
      | "RESTRICTED"
      | "ENABLED"
      | "DISABLED";
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirementsDue: string[];
    disabledReason: string | null;
    syncedAt: string | null;
  };
  compliance: {
    status: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
    note: string | null;
    checkedAt: string | null;
  };
  bank: { bankName: string | null; ibanLast4: string | null };
  balance: { availableCents: number; pendingCents: number } | null;
  schedule: unknown;
  holdDays: number;
  canReceiveOrders: boolean;
}

export interface CookEarnings {
  cookId: string;
  canReceiveOrders: boolean;
  status: {
    stripe: CookPayoutSettings["stripe"]["status"];
    compliance: string;
  };
  totals: {
    thisMonthGrossCents: number;
    thisMonthCommissionCents: number;
    thisMonthNetCents: number;
    pendingCents: number;
    releasedCents: number;
    ordersCount: number;
  };
  orders: {
    id: string;
    code: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    subtotal: number;
    commission: number;
    cookNet: number;
    itemsCount: number;
    release: {
      status: "PENDING" | "CREATED" | "FAILED" | "REVERSED";
      amount: number;
      reversed: number;
      createdAt: string;
    } | null;
    eligibleAt: string | null;
  }[];
  payouts: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    automatic: boolean;
    arrivalDate: string | null;
    failureMessage: string | null;
    paidAt: string | null;
    createdAt: string;
  }[];
  holdDays: number;
  payoutPolicy: {
    interval: string;
    weeklyAnchor: string;
    monthlyAnchor: number;
  };
  balance: { availableCents: number; pendingCents: number } | null;
}

const TOKEN_STORAGE = {
  access: "darna.accessToken",
  refresh: "darna.refreshToken",
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE.access);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE.refresh);
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

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If the access token expired or the DB was re-seeded, try refreshing once;
  // if refresh fails, clear stale tokens so subsequent calls don't stay broken.
  if (
    res.status === 401 &&
    token &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/auth/refresh") &&
    !path.startsWith("/auth/logout")
  ) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);

      if (refreshRes && refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        setAuthTokens(refreshed.accessToken, refreshed.refreshToken);
        headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
        res = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        });
      } else {
        clearAuthTokens();
      }
    } else {
      clearAuthTokens();
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const err = new Error(
      errorBody.message || `API Error ${res.status}`,
    ) as Error & {
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
      apiRequest<{
        user: AuthUserRecord;
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      apiRequest<{
        user: AuthUserRecord;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    refresh: (refreshToken: string) =>
      apiRequest<{ accessToken: string; refreshToken: string }>(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
      ),
    logout: () =>
      apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" }),
    me: () => apiRequest<AuthUserRecord>("/auth/me"),
  },
  cooks: {
    list: (params?: {
      city?: string;
      cuisine?: string;
      q?: string;
      page?: string;
      limit?: string;
      sort?: string;
    }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
          string,
          string,
        ][],
      ).toString();
      return apiRequest<{
        items: unknown[];
        total: number;
        page: number;
        limit: number;
      }>(`/cooks${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiRequest<unknown>(`/cooks/${id}`),
    apply: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/cooks/apply", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    myDashboard: () => apiRequest<unknown>("/cooks/me/dashboard"),
    myApplication: (email?: string) =>
      apiRequest<CookApplicationStatus | null>(
        `/cooks/me/application${email ? `?email=${encodeURIComponent(email)}` : ""}`,
      ),
    myProfile: () => apiRequest<unknown>("/cooks/me/profile"),
    updateMyProfile: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/cooks/me/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    myAvailability: () =>
      apiRequest<CookAvailabilityRecord>("/cooks/me/availability"),
    updateAvailability: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/cooks/me/availability", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    myEarnings: () => apiRequest<unknown>("/cooks/me/earnings"),
  },
  uploads: {
    uploadImage: async (
      file: File,
      folder: "dishes" | "cooks" | "avatars" | "documents" | "uploads" = "uploads",
    ) => {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/uploads/image?folder=${encodeURIComponent(folder)}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        storage?: "r2" | "local";
        message?: string;
      };
      if (!res.ok || !body.url) {
        throw new Error(body.message || `Upload failed (${res.status})`);
      }
      return { url: body.url, storage: body.storage };
    },
  },
  dishes: {
    list: (params?: Record<string, string>) => {
      const qs = new URLSearchParams(params ?? {}).toString();
      return apiRequest<{
        items: unknown[];
        total: number;
        page: number;
        limit: number;
      }>(`/dishes${qs ? `?${qs}` : ""}`);
    },
    uploadImage: async (file: File) => darnaApi.uploads.uploadImage(file, "dishes"),
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
      apiRequest<{
        id: string;
        code: string;
        paymentStatus: string;
        subtotal: number;
        serviceFee: number;
        total: number;
      }>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    myOrders: () => apiRequest<unknown[]>("/orders"),
    get: (id: string) => apiRequest<unknown>(`/orders/${id}`),
    cancel: (id: string) =>
      apiRequest<unknown>(`/orders/${id}/cancel`, { method: "POST" }),
    cookOrders: (status?: string) =>
      apiRequest<unknown[]>(
        `/orders/cook/me${status ? `?status=${status}` : ""}`,
      ),
    updateStatus: (id: string, status: string) =>
      apiRequest<unknown>(`/orders/cook/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  reviews: {
    list: (params?: { cookId?: string; dishId?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
          string,
          string,
        ][],
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
    config: () =>
      apiRequest<{
        publishableKey: string;
        currency: string;
        country: string;
        testMode: boolean;
        supportedMethods: string[];
        idealBanks: { id: string; name: string }[];
      }>("/payments/config"),

    /**
     * Creates a Stripe-hosted Checkout Session for an existing order. The
     * amount is always recomputed on the server; never send money from here.
     */
    createCheckoutSession: (body: {
      orderCode: string;
      paymentMethod?: "ideal" | "card" | "bancontact";
    }) =>
      apiRequest<{
        sessionId: string;
        url: string;
        amountCents: number;
        currency: string;
      }>("/payments/checkout-session", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    /** Stripe-hosted onboarding; the cook never gets a Stripe dashboard. */
    createOnboardingLink: () =>
      apiRequest<{ url: string; expiresAt: number; accountId: string }>(
        "/payments/cook/onboarding-link",
        { method: "POST" },
      ),

    getCookPayoutSettings: () =>
      apiRequest<CookPayoutSettings>("/payments/cook/payout-settings"),

    syncCookPayoutSettings: () =>
      apiRequest<CookPayoutSettings>("/payments/cook/payout-settings/sync", {
        method: "POST",
      }),

    updatePayoutSchedule: (body: {
      interval: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
      weeklyAnchor?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
      monthlyAnchor?: number;
    }) =>
      apiRequest<unknown>("/payments/cook/payout-schedule", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    getCookEarnings: () => apiRequest<CookEarnings>("/payments/cook/earnings"),
  },
  admin: {
    overview: (range?: "30d" | "90d") =>
      apiRequest<AdminOverviewResponse>(
        `/admin/overview${range ? `?range=${range}` : ""}`,
      ),
    orders: (params?: { status?: string; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
          string,
          string,
        ][],
      ).toString();
      return apiRequest<unknown[]>(`/admin/orders${qs ? `?${qs}` : ""}`);
    },
    updateOrderStatus: (id: string, status: string) =>
      apiRequest<unknown>(`/admin/orders/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    cooks: (params?: { status?: string; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
          string,
          string,
        ][],
      ).toString();
      return apiRequest<unknown>(`/admin/cooks${qs ? `?${qs}` : ""}`);
    },
    cookWorkspace: (id: string) =>
      apiRequest<unknown>(`/admin/cooks/${encodeURIComponent(id)}`),
    createCookDish: (id: string, body: Record<string, unknown>) =>
      apiRequest<unknown>(`/admin/cooks/${encodeURIComponent(id)}/dishes`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateCookAvailability: (id: string, body: Record<string, unknown>) =>
      apiRequest<unknown>(
        `/admin/cooks/${encodeURIComponent(id)}/availability`,
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    updateCookStatus: (id: string, status: string) =>
      apiRequest<unknown>(`/admin/cooks/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    approveVerification: (id: string, notes?: string) =>
      apiRequest<unknown>(
        `/admin/verifications/${encodeURIComponent(id)}/approve`,
        { method: "POST", body: JSON.stringify({ notes }) },
      ),
    requestVerificationChanges: (id: string, notes?: string) =>
      apiRequest<unknown>(
        `/admin/verifications/${encodeURIComponent(id)}/request-changes`,
        { method: "POST", body: JSON.stringify({ notes }) },
      ),
    dishes: (params?: { filter?: string; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
          string,
          string,
        ][],
      ).toString();
      return apiRequest<unknown[]>(`/admin/dishes${qs ? `?${qs}` : ""}`);
    },
    moderateDish: (id: string, status: string) =>
      apiRequest<unknown>(`/admin/dishes/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    removeDish: (id: string) =>
      apiRequest<unknown>(`/admin/dishes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    payouts: () => apiRequest<AdminPayoutRecord[]>("/admin/payouts"),
    syncPayout: (id: string) =>
      apiRequest<unknown>(`/admin/payouts/${encodeURIComponent(id)}/sync`, {
        method: "POST",
      }),
    marketplace: () =>
      apiRequest<{
        balance: { availableCents: number; pendingCents: number } | null;
        readiness: { ready: number; blocked: number; notStarted: number };
        pricing: {
          serviceFeeCents: number;
          serviceFee: number;
          commissionRate: number;
          commissionFixedCents: number;
          commissionBase: string;
          minOrderCents: number;
          stripeFeeBearer: string;
        };
        payoutPolicy: {
          holdDays: number;
          interval: string;
          weeklyAnchor: string;
          monthlyAnchor: number;
        };
        transfers: {
          id: string;
          orderCode: string;
          cook: string;
          cookId: string;
          amount: number;
          reversed: number;
          status: string;
          stripeTransferId: string | null;
          failureReason: string | null;
          createdAt: string;
        }[];
        payouts: {
          id: string;
          cook: string;
          cookId: string;
          amount: number;
          status: string;
          automatic: boolean;
          arrivalDate: string | null;
          failureMessage: string | null;
          paidAt: string | null;
        }[];
        webhookEvents: {
          stripeEventId: string;
          type: string;
          processedAt: string | null;
          attempts: number;
          error: string | null;
          createdAt: string;
        }[];
        settings: Record<string, unknown>;
      }>("/admin/marketplace"),
    releaseTransfers: () =>
      apiRequest<{ released: number; failed: number; skipped: number }>(
        "/admin/marketplace/release",
        { method: "POST" },
      ),
    refundOrder: (id: string, body: { amount?: number; reason?: string }) =>
      apiRequest<unknown>(`/admin/orders/${encodeURIComponent(id)}/refund`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateCookCompliance: (
      id: string,
      body: {
        status: string;
        note?: string;
        kvkNumber?: string;
        nvwaRegistered?: boolean;
        payoutHoldDays?: number;
      },
    ) =>
      apiRequest<unknown>(`/admin/cooks/${encodeURIComponent(id)}/compliance`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    syncCookAccount: (id: string) =>
      apiRequest<unknown>(
        `/admin/cooks/${encodeURIComponent(id)}/sync-stripe`,
        { method: "POST" },
      ),
    disputes: (status?: string) =>
      apiRequest<unknown[]>(
        `/admin/disputes${status ? `?status=${encodeURIComponent(status)}` : ""}`,
      ),
    resolveDispute: (
      id: string,
      body: { refundAmount?: number; resolutionNote?: string; status?: string },
    ) =>
      apiRequest<unknown>(`/admin/disputes/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    settings: () => apiRequest<Record<string, unknown>>("/admin/settings"),
    updateSettings: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  support: {
    catalog: () =>
      apiRequest<{
        serviceFee: number;
        serviceFeeCents: number;
        minOrderCents: number;
        cuisines: CatalogCuisine[];
        pickupOptions: PickupOption[];
      }>("/support/catalog"),
    createTicket: (body: {
      email?: string;
      orderCode?: string;
      message: string;
    }) =>
      apiRequest<unknown>("/support/tickets", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  users: {
    me: () => apiRequest<unknown>("/users/me"),
    updateProfile: (body: Record<string, unknown>) =>
      apiRequest<unknown>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    favorites: () =>
      apiRequest<{ dishes: FavoriteRecord[]; cooks: FavoriteRecord[] }>(
        "/users/me/favorites",
      ),
    toggleFavoriteDish: (dishId: string) =>
      apiRequest<{ favorited: boolean }>(
        `/users/me/favorites/dishes/${encodeURIComponent(dishId)}`,
        { method: "POST" },
      ),
    toggleFavoriteCook: (cookId: string) =>
      apiRequest<{ favorited: boolean }>(
        `/users/me/favorites/cooks/${encodeURIComponent(cookId)}`,
        { method: "POST" },
      ),
    notifications: () =>
      apiRequest<UserNotification[]>("/users/me/notifications"),
    markNotificationsRead: () =>
      apiRequest<unknown>("/users/me/notifications/read-all", {
        method: "POST",
      }),
  },
};
