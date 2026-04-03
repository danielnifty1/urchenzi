"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  VendorDashboardProduct,
  VendorFeatureFlags,
  VendorStoreSettings,
} from "@/types/vendorDashboard";

const defaultProducts: VendorDashboardProduct[] = [
  {
    id: "vp1",
    name: "Margherita Pizza",
    description: "Fresh mozzarella, basil, tomato sauce",
    price: 9.5,
    category: "Popular",
    inStock: true,
    image:
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80",
  },
  {
    id: "vp2",
    name: "Caesar Salad",
    description: "Romaine, parmesan, house dressing",
    price: 4.5,
    category: "Meals",
    inStock: true,
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80",
  },
  {
    id: "vp3",
    name: "Iced Latte",
    description: "Double shot, oat milk option",
    price: 2.8,
    category: "Drinks",
    inStock: false,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
  },
];

const defaultFeatures: VendorFeatureFlags = {
  onlineOrdering: true,
  scheduledOrders: true,
  promoBanners: false,
  customerNotifications: true,
  analyticsEmails: true,
  autoAcceptOrders: false,
};

const defaultSettings: VendorStoreSettings = {
  storeName: "My Kitchen",
  tagline: "Fresh food delivered fast",
  category: "food",
  minOrder: 25,
  deliveryFee: 5,
  prepTimeMin: 20,
  prepTimeMax: 35,
  isOpen: true,
};

type VendorDashboardState = {
  products: VendorDashboardProduct[];
  features: VendorFeatureFlags;
  settings: VendorStoreSettings;
  addProduct: (p: Omit<VendorDashboardProduct, "id">) => void;
  updateProduct: (id: string, patch: Partial<VendorDashboardProduct>) => void;
  removeProduct: (id: string) => void;
  setFeatures: (patch: Partial<VendorFeatureFlags>) => void;
  setSettings: (patch: Partial<VendorStoreSettings>) => void;
  resetDemo: () => void;
};

export const useVendorDashboardStore = create<VendorDashboardState>()(
  persist(
    (set) => ({
      products: defaultProducts,
      features: defaultFeatures,
      settings: defaultSettings,
      addProduct: (p) =>
        set((s) => ({
          products: [
            ...s.products,
            { ...p, id: `vp-${Date.now().toString(36)}` },
          ],
        })),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      setFeatures: (patch) =>
        set((s) => ({ features: { ...s.features, ...patch } })),
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetDemo: () =>
        set({
          products: defaultProducts,
          features: defaultFeatures,
          settings: defaultSettings,
        }),
    }),
    { name: "urchenzi-vendor-dashboard" },
  ),
);
