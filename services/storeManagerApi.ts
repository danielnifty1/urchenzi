import { http } from "@/lib/api/client";
import type { VendorStoreListItem } from "@/types/vendorMultiStore";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

/**
 * GET /store-manager/stores — JWT with role store_manager; no `x-store-id` required.
 * Response: `{ items: [{ storeId, storeName }] }` (and optional snake_case aliases).
 */
export async function fetchStoreManagerStores(): Promise<VendorStoreListItem[]> {
  const { data } = await http.get<unknown>("/store-manager/stores", { skipStoreContext: true });
  const body = unwrap<Record<string, unknown>>(data);
  const raw = body.items ?? body.data;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeItem).filter((x): x is VendorStoreListItem => Boolean(x?.id));
}

function normalizeItem(entry: unknown): VendorStoreListItem | null {
  if (!entry || typeof entry !== "object") return null;
  const r = entry as Record<string, unknown>;
  const id = r.storeId ?? r.store_id ?? r.id;
  const name = String(r.storeName ?? r.store_name ?? r.name ?? "Store");
  if (id == null || String(id).trim() === "") return null;
  return {
    id: String(id),
    name,
    status: "active",
  };
}
