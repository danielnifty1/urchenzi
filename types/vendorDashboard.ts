import type { VendorCategory } from "@/types";
import type { StoreImageInput } from "@/types/vendorStore";

export type VendorDashboardProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  image: string;
};

/** Nested image on POST /vendor/products (FileUploadDto). */
export type VendorProductImagePayload = Pick<StoreImageInput, "data" | "fileName" | "mimeType">;

/** POST /vendor/products — CreateVendorProductDto */
export type CreateVendorProductPayload = {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  inStock?: boolean;
  image: VendorProductImagePayload;
};

/** PATCH /vendor/products/:id — PatchVendorProductDto */
export type PatchVendorProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  inStock?: boolean;
  image?: string | null;
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
  /** Public storefront path segment; unique per vendor when set. */
  storeSlug?: string | null;
  /** Longer description for storefront / dashboard. */
  description?: string;
  /** Hero / logo image URL. */
  storeImage?: string;
  /** Free-text hours, e.g. "Mon–Fri 9–5". */
  openingHours?: string;
};
