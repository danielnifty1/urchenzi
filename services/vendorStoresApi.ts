import { http } from "@/lib/api/client";
import type {
  CreateStoreBody,
  DeleteStoreResponse,
  PatchStoreBody,
  VendorApiStoreStatus,
  VendorStoreEntity,
} from "@/types/vendorStore";
import type { VendorStoreListItem, VendorStoreStatus } from "@/types/vendorMultiStore";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function normalizeEntity(raw: unknown): VendorStoreEntity | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id;
  if (id == null || String(id).trim() === "") return null;
  const vendorId = r.vendorId ?? r.vendor_id;
  const imageRaw = r.image;
  let image: string | null = null;
  if (typeof imageRaw === "string") {
    image = imageRaw;
  } else if (imageRaw && typeof imageRaw === "object") {
    const img = imageRaw as Record<string, unknown>;
    image =
      (typeof img.url === "string" && img.url) ||
      (typeof img.path === "string" && img.path) ||
      (typeof img.data === "string" && img.data) ||
      null;
  }
  return {
    id: String(id),
    vendorId: vendorId != null ? String(vendorId) : "",
    name: String(r.name ?? "Store"),
    address: String(r.address ?? ""),
    image,
    status: normalizeApiStatus(r.status),
    slug: r.slug != null && String(r.slug) !== "" ? String(r.slug) : null,
    createdAt: r.createdAt != null ? String(r.createdAt) : r.created_at != null ? String(r.created_at) : undefined,
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : r.updated_at != null ? String(r.updated_at) : undefined,
  };
}

function normalizeApiStatus(raw: unknown): VendorApiStoreStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "inactive") return "inactive";
  if (s === "draft") return "draft";
  return "active";
}

function listUiStatus(api: VendorApiStoreStatus): VendorStoreStatus {
  if (api === "active") return "active";
  return "pending";
}

/** Map API store → dashboard store row (list cards / directory). */
export function vendorStoreEntityToAccessibleRow(e: VendorStoreEntity): VendorStoreListItem {
  return {
    id: e.id,
    name: e.name,
    slug: e.slug ?? undefined,
    image: e.image ?? undefined,
    address: e.address || undefined,
    status: listUiStatus(e.status),
  };
}

export async function listMyStores(): Promise<VendorStoreEntity[]> {
  const { data } = await http.get<unknown>("/stores");
  const body = unwrap<unknown>(data);
  const list = Array.isArray(body) ? body : [];
  return list.map(normalizeEntity).filter((x): x is VendorStoreEntity => x !== null);
}

export async function getStore(storeId: string): Promise<VendorStoreEntity> {
  const { data } = await http.get<unknown>(`/stores/${encodeURIComponent(storeId)}`);
  const row = normalizeEntity(unwrap(data));
  if (!row) throw new Error("Invalid store response");
  return row;
}

export async function createStore(body: CreateStoreBody): Promise<VendorStoreEntity> {
  const { data } = await http.post<unknown>("/stores", body);
  const row = normalizeEntity(unwrap(data));
  if (!row) throw new Error("Invalid store response");
  return row;
}

export async function updateStore(storeId: string, patch: PatchStoreBody): Promise<VendorStoreEntity> {
  const { data } = await http.patch<unknown>(`/stores/${encodeURIComponent(storeId)}`, patch);
  const row = normalizeEntity(unwrap(data));
  if (!row) throw new Error("Invalid store response");
  return row;
}

export async function deleteStore(storeId: string): Promise<DeleteStoreResponse> {
  const { data } = await http.delete<unknown>(`/stores/${encodeURIComponent(storeId)}`);
  const b = unwrap<Record<string, unknown>>(data);
  return {
    message: String(b.message ?? "Deleted"),
    id: String(b.id ?? storeId),
    softDeleted: Boolean(b.softDeleted ?? b.soft_deleted ?? true),
  };
}
