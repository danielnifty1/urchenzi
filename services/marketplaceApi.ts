import axios from "axios";
import { http } from "@/lib/api/client";
import {
  createMockOrder,
  getMockOrder,
  products as mockProducts,
  vendors as mockVendors,
} from "@/services/mockData";
import type { StorePageData, StorePageProduct, StorePageSection } from "@/types/storePage";
import type { Order, Product, Vendor } from "@/types";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function normalizeVendorArray(raw: unknown): Vendor[] {
  const pickList = (node: unknown): Record<string, unknown>[] => {
    if (Array.isArray(node)) return node.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      for (const key of ["items", "vendors", "stores", "data", "results", "content", "rows"]) {
        const v = o[key];
        if (Array.isArray(v)) {
          return v.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
        }
      }
      if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
        return pickList(o.data);
      }
    }
    return [];
  };

  const asNum = (v: unknown, fallback = 0): number => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const asText = (v: unknown, fallback = ""): string => {
    if (v == null) return fallback;
    const s = String(v).trim();
    return s || fallback;
  };

  const rows = pickList(raw);
  return rows
    .map((row): Vendor | null => {
      const id = asText(row.id ?? row.vendorId ?? row.vendor_id);
      if (!id) return null;

      const rating = asNum(row.rating ?? row.avgRating ?? row.averageRating, 4.5);
      const reviewCount = asNum(row.reviewCount ?? row.reviewsCount ?? row.totalReviews, 0);
      const deliveryFee = asNum(row.deliveryFee ?? row.delivery_fee, 0);
      const minOrder = asNum(row.minOrder ?? row.min_order, 0);
      const prepMin = asNum(row.prepTimeMin ?? row.prep_time_min, 20);
      const prepMax = asNum(row.prepTimeMax ?? row.prep_time_max, Math.max(prepMin, 35));
      const image = asText(
        row.image ?? row.storeImage ?? row.store_image ?? row.logo ?? row.logoUrl ?? row.logo_url,
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      );
      const category = asText(row.category, "shops") as Vendor["category"];
      const isOpen = Boolean(row.isOpen ?? row.is_open ?? true);

      return {
        id,
        storeSlug: asText(row.slug ?? row.storeSlug ?? row.store_slug) || undefined,
        name: asText(row.name ?? row.storeName ?? row.store_name ?? row.businessName, "Store"),
        image,
        rating,
        reviewCount,
        deliveryTime: `${Math.max(1, prepMin)}-${Math.max(prepMin, prepMax)} min`,
        category,
        deliveryFee,
        minOrder,
        freeDeliveryThreshold: asNum(row.freeDeliveryThreshold ?? row.free_delivery_threshold, 0) || undefined,
        discount: asNum(row.discount ?? row.discountPercent ?? row.discount_percent, 0) || undefined,
        isOpen,
        description: asText(row.description ?? row.tagline, "Quality products delivered fast."),
        estimatedDelivery: `${Math.max(1, prepMin)}-${Math.max(prepMin, prepMax)} min`,
      };
    })
    .filter((v): v is Vendor => v !== null);
}

function normalizeProductArray(raw: unknown): Product[] {
  const pickList = (node: unknown): Record<string, unknown>[] => {
    if (Array.isArray(node)) return node.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      for (const key of ["items", "products", "data", "results"]) {
        const v = o[key];
        if (Array.isArray(v)) {
          return v.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
        }
      }
      if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) return pickList(o.data);
    }
    return [];
  };
  const asText = (v: unknown, fallback = ""): string => (v == null ? fallback : String(v));
  const asNum = (v: unknown, fallback = 0): number => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return pickList(raw).map((o): Product => ({
    id: asText(o.id),
    vendorId: asText(o.vendorId ?? o.vendor_id),
    name: asText(o.name),
    description: asText(o.description),
    price: asNum(o.price),
    image: asText(o.image ?? o.imageUrl ?? o.image_url),
    category: "Popular",
  }));
}

type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function extractListWithMeta(raw: unknown): { rows: unknown[]; meta: Partial<ListMeta> } {
  const fallback = { rows: [] as unknown[], meta: {} as Partial<ListMeta> };
  if (Array.isArray(raw)) return { rows: raw, meta: {} };
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const listKeys = ["items", "stores", "vendors", "products", "data", "results", "content", "rows"] as const;
  for (const k of listKeys) {
    const v = o[k];
    if (Array.isArray(v)) {
      const metaRaw = (o.meta && typeof o.meta === "object" ? o.meta : {}) as Record<string, unknown>;
      return {
        rows: v,
        meta: {
          page: Number(metaRaw.page ?? o.page),
          limit: Number(metaRaw.limit ?? o.limit),
          total: Number(metaRaw.total ?? o.total),
          totalPages: Number(metaRaw.totalPages ?? metaRaw.total_pages ?? o.totalPages ?? o.total_pages),
        },
      };
    }
  }
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return extractListWithMeta(o.data);
  }
  return fallback;
}

const useMockOnDevFailure = (e: unknown): boolean => {
  if (process.env.NODE_ENV !== "development") return false;
  if (!axios.isAxiosError(e)) return true;
  const st = e.response?.status;
  if (st === 401 || st === 403) return false;
  return st === undefined || st === 404 || st === 501 || st >= 500;
};

export const marketplaceApi = {
  getVendors: async () => {
    try {
      const limit = 100;
      let page = 1;
      let totalPages = 1;
      const allRows: unknown[] = [];
      while (page <= totalPages) {
        const { data } = await http.get<unknown>("/public/stores", {
          params: { page, limit },
          skipStoreContext: true,
        });
        const body = unwrap(data);
        const { rows, meta } = extractListWithMeta(body);
        allRows.push(...rows);
        totalPages = Math.max(1, Number(meta.totalPages) || 1);
        page += 1;
      }
      return normalizeVendorArray(allRows);
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        console.warn("[marketplace] GET /public/stores — using mock vendors (dev fallback)", e);
        return mockVendors;
      }
      throw e;
    }
  },

  getStorePageBySlug: async (slug: string): Promise<StorePageData> => {
    const toRows = (raw: unknown): Record<string, unknown>[] => {
      if (Array.isArray(raw)) {
        return raw.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
      }
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        for (const key of ["items", "stores", "vendors", "data", "results", "rows"]) {
          const v = o[key];
          if (Array.isArray(v)) return toRows(v);
        }
        if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) return toRows(o.data);
      }
      return [];
    };
    const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v).trim() || fallback);
    const num = (v: unknown, fallback = 0) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    const pickStore = async (): Promise<Record<string, unknown> | null> => {
      const { data } = await http.get<unknown>("/public/stores", {
        params: { page: 1, limit: 100 },
        skipStoreContext: true,
      });
      const rows = toRows(unwrap(data));
      return rows.find((r) => {
        const s = str(r.slug ?? r.storeSlug ?? r.store_slug).toLowerCase();
        return s === slug.toLowerCase();
      }) ?? null;
    };

    const storeRow = await pickStore();
    if (!storeRow) throw new Error("Store not found");

    const storeId = str(storeRow.id ?? storeRow.storeId ?? storeRow.store_id);
    const prepMin = Math.max(1, num(storeRow.prepTimeMin ?? storeRow.prep_time_min, 20));
    const prepMax = Math.max(prepMin, num(storeRow.prepTimeMax ?? storeRow.prep_time_max, 35));
    const name = str(storeRow.name ?? storeRow.storeName ?? storeRow.store_name, "Store");

    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const allProductRows: unknown[] = [];
    while (page <= totalPages) {
      const { data: productsRaw } = await http.get<unknown>(
        `/public/stores/${encodeURIComponent(storeId)}/products`,
        {
          params: { page, limit },
          skipStoreContext: true,
        },
      );
      const body = unwrap(productsRaw);
      const { rows, meta } = extractListWithMeta(body);
      allProductRows.push(...rows);
      totalPages = Math.max(1, Number(meta.totalPages) || 1);
      page += 1;
    }
    const productRows = normalizeProductArray(allProductRows);
    const normalizedStore = normalizeVendorArray([storeRow])[0];
    const safeStore = normalizedStore ?? {
      id: storeId,
      name,
      image: str(
        storeRow.image ?? storeRow.storeImage ?? storeRow.store_image ?? storeRow.logo ?? storeRow.logo_url,
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
      ),
      rating: 4.5,
      reviewCount: 0,
      deliveryTime: `${prepMin}-${prepMax} min`,
      category: "shops" as Vendor["category"],
      deliveryFee: num(storeRow.deliveryFee ?? storeRow.delivery_fee, 0),
      minOrder: num(storeRow.minOrder ?? storeRow.min_order, 0),
      isOpen: Boolean(storeRow.isOpen ?? storeRow.is_open ?? true),
      description: str(storeRow.description ?? storeRow.tagline, "Quality products delivered fast."),
      estimatedDelivery: `${prepMin}-${prepMax} min`,
    };

    const productMap: Record<string, StorePageProduct> = {};
    for (const p of productRows) {
      productMap[p.id] = {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        categoryId: (p.category || "general").toLowerCase().replace(/\s+/g, "-"),
      };
    }
    const sectionMap = new Map<string, StorePageSection>();
    for (const p of Object.values(productMap)) {
      if (!sectionMap.has(p.categoryId)) {
        sectionMap.set(p.categoryId, {
          id: p.categoryId,
          title: p.categoryId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          productIds: [],
        });
      }
      sectionMap.get(p.categoryId)?.productIds.push(p.id);
    }
    const sections = Array.from(sectionMap.values());

    return {
      slug,
      vendorId: storeId,
      name: safeStore.name,
      city: str(storeRow.city ?? storeRow.location ?? "City"),
      breadcrumbCategory: str(safeStore.category, "Store"),
      bannerImage: safeStore.image,
      ratingPercent: Math.round(safeStore.rating * 20),
      deliveryTime: safeStore.deliveryTime,
      deliveryFee: safeStore.deliveryFee,
      deliveryFeeFree: safeStore.deliveryFee <= 0,
      isOpen: safeStore.isOpen,
      categories: sections.map((s) => ({ id: s.id, label: s.title })),
      sections,
      products: productMap,
    };
  },

  getVendor: async (id: string) => {
    try {
      const { data } = await http.get<unknown>(`/vendors/${id}`);
      return unwrap<Vendor>(data);
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        const v = mockVendors.find((item) => item.id === id);
        if (v) return v;
      }
      throw e;
    }
  },

  getProducts: async (vendorId: string) => {
    try {
      const { data } = await http.get<unknown>("/products", { params: { vendorId } });
      return normalizeProductArray(unwrap(data));
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        return mockProducts.filter((p) => p.vendorId === vendorId);
      }
      throw e;
    }
  },

  createOrder: async (order: Order) => {
    try {
      const { data } = await http.post<unknown>("/orders", order);
      return unwrap<Order>(data);
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        console.warn("[marketplace] POST /orders — using mock order (dev fallback)", e);
        return createMockOrder(order);
      }
      throw e;
    }
  },

  getOrder: async (id: string) => {
    try {
      const { data } = await http.get<unknown>(`/orders/${id}`);
      return unwrap<Order>(data);
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        const o = getMockOrder(id);
        if (o) return o;
      }
      throw e;
    }
  },
};
