import axios from "axios";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { http } from "@/lib/api/client";
import type {
  CreateVendorProductPayload,
  PatchVendorProductPayload,
  VendorDashboardProduct,
  VendorFeatureFlags,
  VendorStoreSettings,
} from "@/types/vendorDashboard";
import type { VendorCategory } from "@/types";

export type VendorDashboardMetrics = {
  productCount: number;
  inStockCount: number;
  featuresEnabledCount: number;
  /** Vendor-wide totals (GET /vendor/dashboard or /vendor/me without x-store-id). */
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
};

export type VendorDashboardOverview = {
  settings: VendorStoreSettings;
  features: VendorFeatureFlags;
  metrics: VendorDashboardMetrics;
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProduct(raw: Record<string, unknown>): VendorDashboardProduct {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    price: num(raw.price),
    category: String(raw.category ?? ""),
    inStock: Boolean(raw.inStock ?? raw.in_stock),
    image: String(raw.image ?? ""),
  };
}

function normalizeSettings(raw: Record<string, unknown>): VendorStoreSettings {
  return {
    storeName: String(raw.storeName ?? raw.store_name ?? ""),
    tagline: String(raw.tagline ?? ""),
    category: (String(raw.category ?? "food") as VendorCategory) || "food",
    minOrder: num(raw.minOrder ?? raw.min_order),
    deliveryFee: num(raw.deliveryFee ?? raw.delivery_fee),
    prepTimeMin: num(raw.prepTimeMin ?? raw.prep_time_min, 20),
    prepTimeMax: num(raw.prepTimeMax ?? raw.prep_time_max, 35),
    isOpen: Boolean(raw.isOpen ?? raw.is_open ?? true),
    storeSlug:
      raw.storeSlug != null || raw.store_slug != null
        ? String(raw.storeSlug ?? raw.store_slug)
        : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    storeImage: (() => {
      const v = raw.storeImage ?? raw.store_image ?? raw.imageUrl ?? raw.image_url;
      if (v == null || String(v).trim() === "") return undefined;
      return String(v);
    })(),
    openingHours: raw.openingHours != null
      ? String(raw.openingHours)
      : raw.opening_hours != null
        ? String(raw.opening_hours)
        : undefined,
  };
}

function normalizeFeatures(raw: Record<string, unknown>): VendorFeatureFlags {
  const g = (camel: keyof VendorFeatureFlags, snake: string) =>
    Boolean(raw[camel] ?? raw[snake]);
  return {
    onlineOrdering: g("onlineOrdering", "online_ordering"),
    scheduledOrders: g("scheduledOrders", "scheduled_orders"),
    promoBanners: g("promoBanners", "promo_banners"),
    customerNotifications: g("customerNotifications", "customer_notifications"),
    analyticsEmails: g("analyticsEmails", "analytics_emails"),
    autoAcceptOrders: g("autoAcceptOrders", "auto_accept_orders"),
  };
}

function normalizeOverview(data: Record<string, unknown>): VendorDashboardOverview {
  const settingsRaw = (data.settings as Record<string, unknown>) ?? {};
  const featuresRaw = (data.features as Record<string, unknown>) ?? {};
  const metricsRaw = (data.metrics as Record<string, unknown>) ?? {};

  const productCount = num(
    metricsRaw.productCount ?? metricsRaw.product_count ?? metricsRaw.totalProducts ?? metricsRaw.total_products,
  );
  const totalProducts = num(
    metricsRaw.totalProducts ?? metricsRaw.total_products ?? metricsRaw.productCount ?? metricsRaw.product_count,
  );
  return {
    settings: normalizeSettings(settingsRaw),
    features: normalizeFeatures(featuresRaw),
    metrics: {
      productCount: productCount || totalProducts,
      inStockCount: num(metricsRaw.inStockCount ?? metricsRaw.in_stock_count),
      featuresEnabledCount: num(
        metricsRaw.featuresEnabledCount ?? metricsRaw.features_enabled_count,
      ),
      totalStores: num(metricsRaw.totalStores ?? metricsRaw.total_stores),
      totalProducts: totalProducts || productCount,
      totalOrders: num(metricsRaw.totalOrders ?? metricsRaw.total_orders),
      totalRevenue: num(metricsRaw.totalRevenue ?? metricsRaw.total_revenue),
    },
  };
}

function unwrapData<T extends Record<string, unknown>>(data: T): T {
  const inner = data.data as T | undefined;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner;
  }
  return data;
}

function extractSettingsPayload(data: Record<string, unknown>): Record<string, unknown> {
  const body = unwrapData(data);
  const nested = body.settings;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return body;
}

export async function getVendorDashboard(storeId?: string | null): Promise<VendorDashboardOverview> {
  const hasStore = Boolean(storeId && storeId.trim() !== "");
  const sid = hasStore ? String(storeId).trim() : "";
  const { data } = await http.get<Record<string, unknown>>("/vendor/dashboard", {
    ...(hasStore
      ? {
          params: { storeId: sid },
          headers: { "x-store-id": sid },
        }
      : {}),
  });
  return normalizeOverview(unwrapData(data));
}

/**
 * Vendor-wide dashboard (no `x-store-id`). Tries GET /vendor/dashboard then GET /vendor/me.
 */
export async function getVendorDashboardVendorWide(): Promise<VendorDashboardOverview> {
  const paths = ["/vendor/dashboard", "/vendor/me"];
  let last: unknown;
  for (const path of paths) {
    try {
      const { data } = await http.get<Record<string, unknown>>(path, { skipStoreContext: true });
      return normalizeOverview(unwrapData(data));
    } catch (e) {
      last = e;
      if (axios.isAxiosError(e) && e.response?.status === 404) continue;
      throw e;
    }
  }
  throw last instanceof Error ? last : new Error("Vendor dashboard unavailable");
}

/** Same as getVendorDashboard but forces store context (for parallel global aggregation). */
export async function getVendorDashboardScoped(storeId: string): Promise<VendorDashboardOverview> {
  const { data } = await http.get<Record<string, unknown>>("/vendor/dashboard", {
    params: { storeId },
    headers: { "x-store-id": storeId },
  });
  return normalizeOverview(unwrapData(data));
}

export async function getVendorSettings(storeId?: string | null): Promise<VendorStoreSettings> {
  const hasStore = Boolean(storeId && storeId.trim() !== "");
  const sid = hasStore ? String(storeId).trim() : "";
  const { data } = await http.get<Record<string, unknown>>("/vendor/settings", {
    ...(hasStore
      ? {
          params: { storeId: sid },
          headers: { "x-store-id": sid },
        }
      : {}),
  });
  return normalizeSettings(extractSettingsPayload(data as Record<string, unknown>));
}

export async function patchVendorSettings(
  patch: Partial<VendorStoreSettings>,
  storeId?: string | null,
): Promise<VendorStoreSettings> {
  const hasStore = Boolean(storeId && storeId.trim() !== "");
  const sid = hasStore ? String(storeId).trim() : "";
  const { data } = await http.patch<Record<string, unknown>>("/vendor/settings", patch, {
    ...(hasStore
      ? {
          params: { storeId: sid },
          headers: { "x-store-id": sid },
        }
      : {}),
  });
  return normalizeSettings(extractSettingsPayload(data as Record<string, unknown>));
}

export async function getVendorFeatures(): Promise<VendorFeatureFlags> {
  const { data } = await http.get<Record<string, unknown>>("/vendor/features");
  return normalizeFeatures(unwrapData(data as Record<string, unknown>));
}

export async function patchVendorFeatures(
  patch: Partial<VendorFeatureFlags>,
): Promise<VendorFeatureFlags> {
  const { data } = await http.patch<Record<string, unknown>>("/vendor/features", patch);
  return normalizeFeatures(data as Record<string, unknown>);
}

export type VendorProductsQuery = {
  /** Filter catalog to one store (GET /vendor/products?storeId=). */
  storeId?: string;
  search?: string;
  category?: string;
  inStock?: boolean;
  limit?: number;
  cursor?: string;
};

export type VendorProductsPage = {
  items: VendorDashboardProduct[];
  nextCursor: string | null;
};

export async function getVendorProducts(q: VendorProductsQuery = {}): Promise<VendorProductsPage> {
  const { data } = await http.get<Record<string, unknown>>("/vendor/products", {
    params: {
      storeId: q.storeId,
      search: q.search,
      category: q.category,
      inStock: q.inStock,
      limit: q.limit,
      cursor: q.cursor,
    },
  });
  const body = unwrapData(data);
  const itemsRaw = (body.items ?? body.data ?? []) as Record<string, unknown>[];
  const nextCursor =
    (body.nextCursor ?? body.next_cursor ?? null) as string | null | undefined;
  return {
    items: itemsRaw.map((row) => normalizeProduct(row)),
    nextCursor: nextCursor ?? null,
  };
}

export async function createVendorProduct(body: CreateVendorProductPayload): Promise<VendorDashboardProduct> {
  const payload: Record<string, unknown> = {
    storeId: body.storeId,
    name: body.name.trim(),
    price: body.price,
    image: {
      data: body.image.data,
      fileName: body.image.fileName,
      mimeType: body.image.mimeType,
    },
  };
  const d = body.description?.trim();
  if (d) payload.description = d;
  const c = body.category?.trim();
  if (c) payload.category = c;
  if (body.inStock !== undefined) payload.inStock = body.inStock;

  const { data } = await http.post<Record<string, unknown>>("/vendor/products", payload);
  return normalizeProduct(data as Record<string, unknown>);
}

export async function patchVendorProduct(
  id: string,
  patch: PatchVendorProductPayload,
): Promise<VendorDashboardProduct> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.price !== undefined) body.price = patch.price;
  if (patch.category !== undefined) body.category = patch.category;
  if (patch.inStock !== undefined) body.inStock = patch.inStock;
  if (patch.image !== undefined) body.image = patch.image;

  const { data } = await http.patch<Record<string, unknown>>(`/vendor/products/${id}`, body);
  return normalizeProduct(data as Record<string, unknown>);
}

export async function deleteVendorProduct(id: string): Promise<void> {
  await http.delete(`/vendor/products/${id}`);
}

export async function uploadVendorMedia(file: File): Promise<{ url: string }> {
  const image = await imagePayloadFromFile(file, "vendor media");
  const { data } = await http.post<{ url: string }>("/vendor/media", { image });
  return data;
}
