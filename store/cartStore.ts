"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";

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
          const existing = state.items.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
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
            vendorId: state.vendorId ?? product.vendorId,
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
    { name: "urchenzi-cart" },
  ),
);
