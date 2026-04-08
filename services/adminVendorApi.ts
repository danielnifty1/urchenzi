import { http } from "@/lib/api/client";
import { parseAdminVendorProductList } from "@/lib/admin/vendorWorkspace";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export async function adminVendorDashboard(vendorId: string, storeId: string): Promise<unknown> {
  const { data } = await http.get(`/admin/vendors/${vendorId}/dashboard`, {
    headers: { "x-store-id": storeId },
    params: { storeId },
  });
  return unwrap(data);
}

/** GET /admin/vendors/:vendorId — vendor profile without store context. */
export async function adminVendorGetById(vendorId: string): Promise<unknown> {
  const { data } = await http.get(`/admin/vendors/${vendorId}`);
  return unwrap(data);
}

export async function adminVendorMe(vendorId: string, storeId: string): Promise<unknown> {
  const { data } = await http.get(`/admin/vendors/${vendorId}/me`, {
    headers: { "x-store-id": storeId },
    params: { storeId },
  });
  return unwrap(data);
}

export async function adminVendorGetSettings(vendorId: string, storeId: string): Promise<unknown> {
  const { data } = await http.get(`/admin/vendors/${vendorId}/settings`, {
    headers: { "x-store-id": storeId },
    params: { storeId },
  });
  return unwrap(data);
}

export async function adminVendorGetFeatures(vendorId: string, storeId: string): Promise<unknown> {
  const { data } = await http.get(`/admin/vendors/${vendorId}/features`, {
    headers: { "x-store-id": storeId },
    params: { storeId },
  });
  return unwrap(data);
}

export type AdminVendorProductListPage = {
  rows: Record<string, unknown>[];
  nextCursor: string | null;
};

/** GET /admin/vendors/:id/products — parses common paginated shapes (items, content, nested data, cursor). */
export async function adminVendorListProducts(
  vendorId: string,
  params?: Record<string, string | number | boolean | undefined> & { limit?: number; cursor?: string },
): Promise<AdminVendorProductListPage> {
  const { data } = await http.get(`/admin/vendors/${vendorId}/products`, {
    params: {
      limit: 100,
      ...params,
    },
  });
  return parseAdminVendorProductList(unwrap(data));
}

/** POST /admin/vendors/:vendorId/suspend — linked store owner → suspended */
export async function adminVendorSuspend(vendorId: string): Promise<void> {
  await http.post(`/admin/vendors/${vendorId}/suspend`);
}

/** POST /admin/vendors/:vendorId/ban — linked store owner → banned */
export async function adminVendorBan(vendorId: string): Promise<void> {
  await http.post(`/admin/vendors/${vendorId}/ban`);
}

/** POST /admin/vendors/:vendorId/reinstate — linked store owner → active */
export async function adminVendorReinstate(vendorId: string): Promise<void> {
  await http.post(`/admin/vendors/${vendorId}/reinstate`);
}

/** POST /admin/vendors/:vendorId/approve — Vendor → approved; onboarding approved, rejection cleared */
export async function adminVendorApprove(vendorId: string): Promise<void> {
  await http.post(`/admin/vendors/${vendorId}/approve`);
}

const REJECT_REASON_MAX = 2000;

/** POST /admin/vendors/:vendorId/reject — Vendor → pending; onboarding rejected, optional reason */
export async function adminVendorReject(vendorId: string, body?: { reason?: string }): Promise<void> {
  const reason = body?.reason?.trim();
  const payload =
    reason && reason.length > 0
      ? { reason: reason.slice(0, REJECT_REASON_MAX) }
      : {};
  await http.post(`/admin/vendors/${vendorId}/reject`, payload);
}
