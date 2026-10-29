"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  translate,
  isRtl,
  locales,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n";
import {
  cooks as fallbackCooks,
  currentUser as fallbackUser,
  dishes as fallbackDishes,
  getDish,
  pickupOptions,
  SERVICE_FEE,
  type Cook,
  type Dish,
  type OrderItem,
} from "@/lib/data";
import { darnaApi, getAccessToken, setAuthTokens } from "@/lib/api";
import {
  queryKeys,
  useCooksQuery,
  useCreateOrderMutation,
  useCurrentUserQuery,
  useDishesQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "@/lib/queries";

export type CartLine = { dishId: string; qty: number };
export type ToastVariant = "success" | "error" | "info";
export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type PendingSwitch = { dishId: string; qty: number } | null;

export type PlacedOrder = {
  code: string;
  cookId: string;
  items: OrderItem[];
  pickup: string;
  pickupTime: string;
  total: number;
  email: string;
  payment: string;
  note?: string;
};

export type AuthUser = {
  id?: string;
  name: string;
  firstName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  postcode?: string;
  city?: string;
  role?: "CUSTOMER" | "COOK" | "ADMIN";
};

type AppContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey | string, vars?: Record<string, string | number>) => string;
  dishes: Dish[];
  cooks: Cook[];
  user: AuthUser;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    city?: string;
    role?: "CUSTOMER" | "COOK";
  }) => Promise<void>;
  logout: () => Promise<void>;
  cart: CartLine[];
  cartCount: number;
  cartCookId: string | null;
  addToCart: (dishId: string, qty?: number) => void;
  setQty: (dishId: string, qty: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  pendingSwitch: PendingSwitch;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  favorites: string[];
  favoritesReady: boolean;
  toggleFavorite: (dishId: string) => boolean;
  isFavorite: (dishId: string) => boolean;
  favoriteCooks: string[];
  toggleFavoriteCook: (cookId: string) => boolean;
  isFavoriteCook: (cookId: string) => boolean;
  toasts: ToastMessage[];
  toast: (
    title: string,
    options?: { description?: string; variant?: ToastVariant },
  ) => void;
  dismissToast: (id: number) => void;
  lastOrder: PlacedOrder | null;
  placeOrder: (order: Omit<PlacedOrder, "code">) => string;
  reorderCart: (items: OrderItem[]) => void;
  pickup: string;
  setPickup: (id: string) => void;
  pickupTime: string;
  setPickupTime: (time: string) => void;
  cartNote: string;
  setCartNote: (note: string) => void;
  serviceFee: number;
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE = {
  lang: "darna.lang",
  cart: "darna.cart",
  favorites: "darna.favorites",
  favoriteCooks: "darna.favoriteCooks",
  pickup: "darna.pickup",
  pickupTime: "darna.pickupTime",
};

const defaultCart: CartLine[] = [
  { dishId: "couscous-royal", qty: 1 },
  { dishId: "brik", qty: 2 },
];
const defaultFavorites = ["kibbeh", "warak-enab", "couscous-royal"];
const defaultFavoriteCooks = ["rana", "fatima"];

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

let toastSeq = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: liveDishes = fallbackDishes } = useDishesQuery();
  const { data: liveCooks = fallbackCooks } = useCooksQuery();
  const { data: apiUser } = useCurrentUserQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const createOrderMutation = useCreateOrderMutation();

  const [lang, setLangState] = useState<Lang>("nl");
  const [cart, setCart] = useState<CartLine[]>(defaultCart);
  const [favorites, setFavorites] = useState<string[]>(defaultFavorites);
  const [favoriteCooks, setFavoriteCooks] = useState<string[]>(
    defaultFavoriteCooks,
  );
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [pickup, setPickupState] = useState<string>("sat-31");
  const [pickupTime, setPickupTimeState] = useState<string>("18:00");
  const [cartNote, setCartNote] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const orderSeq = useRef(2422);

  const findDish = useCallback(
    (id: string) => liveDishes.find((d) => d.id === id) ?? getDish(id),
    [liveDishes],
  );

  // hydrate preferences from localStorage & auto-authenticate demo session if none exists
  useEffect(() => {
    const storedLang = readStored<Lang | null>(STORAGE.lang, null);
    if (storedLang && locales.includes(storedLang)) {
      setLangState(storedLang);
    }
    const storedCart = readStored<CartLine[] | null>(STORAGE.cart, null);
    if (storedCart) setCart(storedCart);
    const storedFavs = readStored<string[] | null>(STORAGE.favorites, null);
    if (storedFavs) setFavorites(storedFavs);
    const storedCooks = readStored<string[] | null>(
      STORAGE.favoriteCooks,
      null,
    );
    if (storedCooks) setFavoriteCooks(storedCooks);
    const storedPickup = readStored<string | null>(STORAGE.pickup, null);
    if (storedPickup) setPickupState(storedPickup);
    const storedTime = readStored<string | null>(STORAGE.pickupTime, null);
    if (storedTime) setPickupTimeState(storedTime);
    setFavoritesReady(true);

    // Auto-authenticate demo session against backend if no token exists yet
    if (!getAccessToken()) {
      darnaApi.auth
        .login({
          email: "sarah.devries@example.nl",
          password: "Darna2026!",
        })
        .then((res) => {
          setAuthTokens(res.accessToken, res.refreshToken);
          queryClient.setQueryData(queryKeys.authMe, res.user);
        })
        .catch(() => {
          /* offline fallback */
        });
    }
  }, [queryClient]);

  // sync <html lang/dir>
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = isRtl(lang) ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(STORAGE.lang, JSON.stringify(lang));
    } catch {
      /* ignore */
    }
  }, [lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE.favoriteCooks,
        JSON.stringify(favoriteCooks),
      );
    } catch {
      /* ignore */
    }
  }, [favoriteCooks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.pickup, JSON.stringify(pickup));
      window.localStorage.setItem(
        STORAGE.pickupTime,
        JSON.stringify(pickupTime),
      );
    } catch {
      /* ignore */
    }
  }, [pickup, pickupTime]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (
      title: string,
      options?: { description?: string; variant?: ToastVariant },
    ) => {
      const id = ++toastSeq;
      const message: ToastMessage = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? "success",
      };
      setToasts((prev) => [...prev.slice(-2), message]);
      const timer = setTimeout(() => dismissToast(id), 3800);
      timers.current.push(timer);
    },
    [dismissToast],
  );

  const t = useCallback(
    (key: TranslationKey | string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      city?: string;
      role?: "CUSTOMER" | "COOK";
    }) => {
      await registerMutation.mutateAsync({
        ...data,
        preferredLang: lang,
      });
    },
    [registerMutation, lang],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const addToCart = useCallback(
    (dishId: string, qty = 1) => {
      const dish = findDish(dishId);
      if (!dish) return;
      const currentCook = cart.length
        ? findDish(cart[0].dishId)?.cookId
        : null;
      if (currentCook && currentCook !== dish.cookId) {
        setPendingSwitch({ dishId, qty });
        return;
      }
      setCart((prev) => {
        const existing = prev.find((line) => line.dishId === dishId);
        if (existing) {
          return prev.map((line) =>
            line.dishId === dishId
              ? {
                  ...line,
                  qty: Math.min(
                    line.qty + qty,
                    findDish(dishId)?.portionsLeft ?? 99,
                  ),
                }
              : line,
          );
        }
        return [...prev, { dishId, qty }];
      });
      toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));

      if (getAccessToken()) {
        darnaApi.cart.addItem({ dishId, qty }).catch(() => {});
      }
    },
    [cart, findDish, lang, toast],
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    const dish = findDish(pendingSwitch.dishId);
    setCart([{ dishId: pendingSwitch.dishId, qty: pendingSwitch.qty }]);
    setPendingSwitch(null);
    if (dish) {
      toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
    }
    if (getAccessToken()) {
      darnaApi.cart
        .replace({ dishId: pendingSwitch.dishId, qty: pendingSwitch.qty })
        .catch(() => {});
    }
  }, [pendingSwitch, findDish, lang, toast]);

  const cancelSwitch = useCallback(() => setPendingSwitch(null), []);

  const setQty = useCallback(
    (dishId: string, qty: number) => {
      if (qty < 1) {
        setCart((prev) => prev.filter((line) => line.dishId !== dishId));
        if (getAccessToken()) {
          darnaApi.cart.updateQty(dishId, 0).catch(() => {});
        }
        return;
      }
      const max = findDish(dishId)?.portionsLeft ?? 99;
      const nextQty = Math.min(qty, max);
      setCart((prev) =>
        prev.map((line) =>
          line.dishId === dishId ? { ...line, qty: nextQty } : line,
        ),
      );
      if (getAccessToken()) {
        darnaApi.cart.updateQty(dishId, nextQty).catch(() => {});
      }
    },
    [findDish],
  );

  const removeFromCart = useCallback((dishId: string) => {
    setCart((prev) => prev.filter((line) => line.dishId !== dishId));
    if (getAccessToken()) {
      darnaApi.cart.updateQty(dishId, 0).catch(() => {});
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    if (getAccessToken()) {
      darnaApi.cart.clear().catch(() => {});
    }
  }, []);

  const toggleFavorite = useCallback((dishId: string) => {
    let added = false;
    setFavorites((prev) => {
      if (prev.includes(dishId)) {
        return prev.filter((id) => id !== dishId);
      }
      added = true;
      return [...prev, dishId];
    });
    if (getAccessToken()) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/users/me/favorites/dishes/${dishId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      ).catch(() => {});
    }
    return added;
  }, []);

  const isFavorite = useCallback(
    (dishId: string) => favorites.includes(dishId),
    [favorites],
  );

  const toggleFavoriteCook = useCallback((cookId: string) => {
    let added = false;
    setFavoriteCooks((prev) => {
      if (prev.includes(cookId)) {
        return prev.filter((id) => id !== cookId);
      }
      added = true;
      return [...prev, cookId];
    });
    if (getAccessToken()) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/users/me/favorites/cooks/${cookId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      ).catch(() => {});
    }
    return added;
  }, []);

  const isFavoriteCook = useCallback(
    (cookId: string) => favoriteCooks.includes(cookId),
    [favoriteCooks],
  );

  const cartCookId = useMemo(() => {
    if (!cart.length) return null;
    return findDish(cart[0].dishId)?.cookId ?? null;
  }, [cart, findDish]);

  const setPickup = useCallback((id: string) => {
    setPickupState(id);
    const option = pickupOptions.find((p) => p.id === id);
    if (option) {
      setPickupTimeState(option.slots[0]);
    }
  }, []);

  const setPickupTime = useCallback((time: string) => {
    setPickupTimeState(time);
  }, []);

  const user = useMemo<AuthUser>(() => {
    if (apiUser) {
      return {
        id: apiUser.id,
        name: apiUser.name || fallbackUser.name,
        firstName: apiUser.firstName || fallbackUser.firstName,
        email: apiUser.email || fallbackUser.email,
        phone: apiUser.phone || fallbackUser.phone,
        avatar: apiUser.avatar || fallbackUser.avatar,
        address: apiUser.address || fallbackUser.address,
        postcode: apiUser.postcode || fallbackUser.postcode,
        city: apiUser.city || fallbackUser.city,
        role: apiUser.role || "CUSTOMER",
      };
    }
    return fallbackUser;
  }, [apiUser]);

  const placeOrder = useCallback(
    (order: Omit<PlacedOrder, "code">) => {
      const code = `DR-${++orderSeq.current}`;
      setLastOrder({ ...order, code });
      setCart([]);

      if (getAccessToken()) {
        createOrderMutation
          .mutateAsync({
            items: order.items,
            pickup: order.pickup,
            pickupTime: order.pickupTime,
            customerName: user.name,
            customerEmail: order.email || user.email,
            customerPhone: user.phone || "+31 6 12 34 56 78",
            note: order.note,
            paymentMethod:
              order.payment?.toUpperCase() === "CARD"
                ? "CARD"
                : order.payment?.toUpperCase() === "BANCONTACT"
                  ? "BANCONTACT"
                  : "IDEAL",
          })
          .then((created: any) => {
            if (created?.code) {
              setLastOrder((prev) =>
                prev ? { ...prev, code: created.code } : prev,
              );
            }
          })
          .catch(() => {});
      }

      return code;
    },
    [createOrderMutation, user],
  );

  const reorderCart = useCallback(
    (items: OrderItem[]) => {
      setCart(
        items
          .filter((item) => Boolean(findDish(item.dishId)))
          .map((item) => ({ dishId: item.dishId, qty: item.qty })),
      );
    },
    [findDish],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      dir: isRtl(lang) ? "rtl" : "ltr",
      t,
      dishes: liveDishes,
      cooks: liveCooks,
      user,
      isAuthenticated: Boolean(apiUser),
      login,
      register,
      logout,
      cart,
      cartCount: cart.reduce((n, line) => n + line.qty, 0),
      cartCookId,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      pendingSwitch,
      confirmSwitch,
      cancelSwitch,
      favorites,
      favoritesReady,
      toggleFavorite,
      isFavorite,
      favoriteCooks,
      toggleFavoriteCook,
      isFavoriteCook,
      toasts,
      toast,
      dismissToast,
      lastOrder,
      placeOrder,
      reorderCart,
      pickup,
      setPickup,
      pickupTime,
      setPickupTime,
      cartNote,
      setCartNote,
      serviceFee: SERVICE_FEE,
    }),
    [
      lang,
      t,
      liveDishes,
      liveCooks,
      user,
      apiUser,
      login,
      register,
      logout,
      cart,
      cartCookId,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      pendingSwitch,
      confirmSwitch,
      cancelSwitch,
      favorites,
      favoritesReady,
      toggleFavorite,
      isFavorite,
      favoriteCooks,
      toggleFavoriteCook,
      isFavoriteCook,
      toasts,
      toast,
      dismissToast,
      lastOrder,
      placeOrder,
      reorderCart,
      pickup,
      setPickup,
      pickupTime,
      setPickupTime,
      cartNote,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
