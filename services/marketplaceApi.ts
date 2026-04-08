import axios from "axios";
import { http } from "@/lib/api/client";
import {
  createMockOrder,
  getMockOrder,
  products as mockProducts,
  vendors as mockVendors,
} from "@/services/mockData";
import type { Order, Product, Vendor } from "@/types";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function normalizeVendorArray(raw: unknown): Vendor[] {
  if (Array.isArray(raw)) return raw as Vendor[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["items", "vendors", "data", "results", "content"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as Vendor[];
    }
  }
  return [];
}

function normalizeProductArray(raw: unknown): Product[] {
  if (Array.isArray(raw)) return raw as Product[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["items", "products", "data", "results"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as Product[];
    }
  }
  return [];
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
      const { data } = await http.get<unknown>("/vendors");
      return normalizeVendorArray(unwrap(data));
    } catch (e) {
      if (useMockOnDevFailure(e)) {
        console.warn("[marketplace] GET /vendors — using mock vendors (dev fallback)", e);
        return mockVendors;
      }
      throw e;
    }
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
