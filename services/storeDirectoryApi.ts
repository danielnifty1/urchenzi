import { http } from "@/lib/api/client";
import axios from "axios";
import { fetchStoreManagerStores } from "@/services/storeManagerApi";
import { listMyStores, vendorStoreEntityToAccessibleRow } from "@/services/vendorStoresApi";
import { useUserStore } from "@/store/userStore";
import type { VendorStoreListItem, VendorStoreStatus } from "@/types/vendorMultiStore";

export type AccessibleStoreRow = VendorStoreListItem;

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

/**
 * **Vendor:** GET /stores (vendor JWT).
 * **Store manager:** GET /store-manager/stores — do not use vendor listing (403 on /stores).
 * Fallback: legacy me/stores paths, then dev env UUID.
 */
export async function fetchMyAccessibleStores(): Promise<AccessibleStoreRow[]> {
  const role = useUserStore.getState().user?.role;
  if (role === "store_manager") {
    return fetchStoreManagerStores();
  }

  try {
    const entities = await listMyStores();
    return entities.map(vendorStoreEntityToAccessibleRow);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const st = e.response?.status;
      if (st !== 404 && st !== 501) throw e;
    } else {
      throw e;
    }
  }

  const tryPaths = ["/me/stores", "/users/me/stores", "/auth/me/stores"];

  for (const path of tryPaths) {
    try {
      const { data } = await http.get(path);
      const body = unwrap<unknown>(data);
      return normalizeStoreList(body);
    } catch (e) {
      if (axios.isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 501)) {
        continue;
      }
      throw e;
    }
  }

  const devId = process.env.NEXT_PUBLIC_DEV_STORE_ID?.trim();
  if (devId && /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/i.test(devId)) {
    return [
      {
        id: devId,
        name: "Dev store (NEXT_PUBLIC_DEV_STORE_ID)",
        slug: "",
        status: "active" as const,
      },
    ];
  }

  return [];
}

function normalizeStoreList(raw: unknown): AccessibleStoreRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => normalizeStoreRow(x)).filter((x): x is AccessibleStoreRow => Boolean(x?.id));
  }
  if (typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const key of ["stores", "items", "data", "results"]) {
    const v = o[key];
    if (Array.isArray(v)) return normalizeStoreList(v);
  }
  return [];
}

function normalizeStoreStatus(raw: unknown): VendorStoreStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "pending" || s === "draft" || s === "review" || s === "inactive") return "pending";
  return "active";
}

function normalizeStoreRow(raw: unknown): AccessibleStoreRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id ?? r.storeId ?? r.store_id;
  if (id == null || String(id).trim() === "") return null;
  const name = String(r.name ?? r.title ?? r.storeName ?? r.store_name ?? "Store");
  const address = r.address != null ? String(r.address) : undefined;
  const slug = r.slug != null ? String(r.slug) : undefined;
  const img = r.image ?? r.imageUrl ?? r.image_url ?? r.logoUrl ?? r.logo_url;
  const image = img != null && String(img).trim() !== "" ? String(img) : undefined;
  const orderCountRaw = r.orderCount ?? r.order_count ?? r.ordersCount ?? r.orders_count;
  const revenueRaw = r.revenue ?? r.totalRevenue ?? r.total_revenue;
  return {
    id: String(id),
    name,
    address,
    slug,
    image,
    status: normalizeStoreStatus(r.status ?? r.state),
    orderCount: typeof orderCountRaw === "number" ? orderCountRaw : Number(orderCountRaw) || undefined,
    revenue: typeof revenueRaw === "number" ? revenueRaw : Number(revenueRaw) || undefined,
  };
}
