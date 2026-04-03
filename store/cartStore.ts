"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";

/** Avoid `window.localStorage` during SSR (throws in Node); real storage is used in the browser bundle. */
const cartPersistStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    const noop: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
    return noop;
  }
  return window.localStorage;
});

type CartStore = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  vendorId?: string;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: undefined,
      addItem: (product) =>
        set((state) => {
          const hasItems = state.items.length > 0;
          const vendorMismatch =
            hasItems && state.items[0]!.vendorId !== product.vendorId;
          const base = vendorMismatch ? [] : state.items;

          const existing = base.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: base.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
              vendorId: product.vendorId,
            };
          }

          return {
            items: [
              ...base,
              {
                id: `${product.id}-${Date.now()}`,
                productId: product.id,
                vendorId: product.vendorId,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image,
              },
            ],
            vendorId: product.vendorId,
          };
        }),
      removeItem: (id) =>
        set((state) => {
          const nextItems = state.items.filter((item) => item.id !== id);
          return {
            items: nextItems,
            vendorId: nextItems[0]?.vendorId,
          };
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== id)
              : state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })),
      clearCart: () => set({ items: [], vendorId: undefined }),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: "urchenzi-cart", storage: cartPersistStorage },
  ),
);
