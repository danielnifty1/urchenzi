import type { VendorCategory } from "@/types";

export type VendorDashboardProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  image: string;
};

export type VendorFeatureFlags = {
  onlineOrdering: boolean;
  scheduledOrders: boolean;
  promoBanners: boolean;
  customerNotifications: boolean;
  analyticsEmails: boolean;
  autoAcceptOrders: boolean;
};

export type VendorStoreSettings = {
  storeName: string;
  tagline: string;
  category: VendorCategory;
  minOrder: number;
  deliveryFee: number;
  prepTimeMin: number;
  prepTimeMax: number;
  isOpen: boolean;
};
