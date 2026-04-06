import axios from "axios";
import { http } from "@/lib/api/client";
import type {
  AdminCatalogProductRow,
  AdminRbacAssignment,
  AdminRbacAssignBody,
  AdminRbacRevokeBody,
  AdminRbacStoreRow,
  AdminRbacUserRow,
  AdminUsersSearchResult,
} from "@/types/adminRbac";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const k of ["stores", "items", "data", "results", "users", "roles", "assignments"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function normalizeStore(row: unknown): AdminRbacStoreRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = r.id ?? r.storeId ?? r.store_id;
  if (id == null || String(id).trim() === "") return null;
  return {
    id: String(id),
    name: String(r.name ?? r.title ?? "Store"),
    slug: r.slug != null ? String(r.slug) : null,
    vendorId: r.vendorId != null ? String(r.vendorId) : r.vendor_id != null ? String(r.vendor_id) : null,
  };
}

function normalizeUser(row: unknown): AdminRbacUserRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = r.id ?? r.userId ?? r.user_id;
  if (id == null || String(id).trim() === "") return null;
  const email = String(r.email ?? "");
  const name =
    r.name != null
      ? String(r.name)
      : r.firstName != null || r.lastName != null
        ? [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || null
        : null;
  return { id: String(id), email, name };
}

function normalizeAssignment(row: unknown): AdminRbacAssignment | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const roleSlug = String(r.roleSlug ?? r.role_slug ?? r.role ?? "");
  if (!roleSlug) return null;
  const sid = r.storeId ?? r.store_id;
  const storeId = sid === null || sid === undefined || sid === "" ? null : String(sid);
  return {
    id: r.id != null ? String(r.id) : r.assignmentId != null ? String(r.assignmentId) : undefined,
    storeId,
    roleSlug,
    storeName: r.storeName != null ? String(r.storeName) : r.store_name != null ? String(r.store_name) : null,
  };
}

/** GET /admin/rbac/stores — API requires userId or email to list that user's stores. */
export async function adminRbacListStores(opts: { userId?: string; email?: string }): Promise<AdminRbacStoreRow[]> {
  const userId = opts.userId?.trim();
  const email = opts.email?.trim();
  const params: Record<string, string> = {};
  if (userId) params.userId = userId;
  else if (email) params.email = email;
  const { data } = await http.get("/admin/rbac/stores", { params });
  const body = unwrap<unknown>(data);
  return asArray(body)
    .map(normalizeStore)
    .filter((x): x is AdminRbacStoreRow => x !== null);
}

function normalizeAdminProduct(row: unknown): AdminCatalogProductRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = r.id ?? r.productId ?? r.product_id;
  if (id == null || String(id).trim() === "") return null;
  const sid = r.storeId ?? r.store_id;
  const vid = r.vendorId ?? r.vendor_id;
  return {
    id: String(id),
    name: String(r.name ?? r.title ?? "Product"),
    price: typeof r.price === "number" ? r.price : r.price != null ? Number(r.price) : undefined,
    vendorId: vid != null ? String(vid) : null,
    storeId: sid != null && sid !== "" ? String(sid) : null,
    storeName: r.storeName != null ? String(r.storeName) : r.store_name != null ? String(r.store_name) : null,
  };
}

/** GET /admin/users — optional q, role, page, limit */
export async function adminSearchUsers(params: {
  q?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersSearchResult> {
  const { data } = await http.get("/admin/users", {
    params: {
      q: params.q?.trim() || undefined,
      role: params.role,
      page: params.page,
      limit: params.limit ?? 50,
    },
  });
  const body = unwrap<unknown>(data);
  const items = asArray(body)
    .map(normalizeUser)
    .filter((x): x is AdminRbacUserRow => x !== null);
  let total: number | undefined;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    const t = o.total ?? o.totalCount ?? o.total_count;
    if (typeof t === "number" && Number.isFinite(t)) total = t;
  }
  return { items, total };
}

/** GET /admin/users?q= — thin wrapper for search-only UIs */
export async function adminRbacSearchUsers(q: string): Promise<AdminRbacUserRow[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const { items } = await adminSearchUsers({ q: query, limit: 50 });
  return items;
}

/** GET /admin/products */
export async function adminListProducts(params: {
  vendorId?: string;
  storeId?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: AdminCatalogProductRow[]; total?: number }> {
  const { data } = await http.get("/admin/products", {
    params: {
      vendorId: params.vendorId,
      storeId: params.storeId,
      page: params.page,
      limit: params.limit ?? 50,
    },
  });
  const body = unwrap<unknown>(data);
  const items = asArray(body)
    .map(normalizeAdminProduct)
    .filter((x): x is AdminCatalogProductRow => x !== null);
  let total: number | undefined;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    const t = o.total ?? o.totalCount ?? o.total_count;
    if (typeof t === "number" && Number.isFinite(t)) total = t;
  }
  return { items, total };
}

/** GET /admin/users/:userId/roles */
export async function adminRbacListUserRoles(userId: string): Promise<AdminRbacAssignment[]> {
  const { data } = await http.get(`/admin/users/${encodeURIComponent(userId)}/roles`);
  const body = unwrap<unknown>(data);
  return asArray(body)
    .map(normalizeAssignment)
    .filter((x): x is AdminRbacAssignment => x !== null);
}

/** POST /admin/rbac/assign */
export async function adminRbacAssign(body: AdminRbacAssignBody): Promise<void> {
  await http.post("/admin/rbac/assign", body);
}

/** POST /admin/rbac/revoke */
export async function adminRbacRevoke(body: AdminRbacRevokeBody): Promise<void> {
  await http.post("/admin/rbac/revoke", body);
}

export type AdminMeRbacGate = {
  /** When true, show RBAC assignment UI (server or legacy session). */
  allowed: boolean;
};

/**
 * Optional: GET /admin/me — narrow who may use RBAC tools.
 * On 404, callers should fall back to session `role === "admin"` (already enforced by AdminAuthProvider).
 */
export async function fetchAdminMeRbacGate(): Promise<AdminMeRbacGate> {
  try {
    const { data } = await http.get("/admin/me");
    const b = unwrap<Record<string, unknown>>(data);
    if (b.rbacAssignmentAllowed === false) return { allowed: false };
    if (b.isSuperAdmin === true || b.is_super_admin === true) return { allowed: true };
    const role = String(b.role ?? "").toLowerCase();
    if (role === "admin") return { allowed: true };
    return { allowed: false };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 404) return { allowed: true };
      if (e.response?.status === 403) return { allowed: false };
    }
    throw e;
  }
}
