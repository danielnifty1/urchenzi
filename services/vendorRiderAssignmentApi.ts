import { http } from "@/lib/api/client";

export type StoreAssignmentMode = "auto" | "manual";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

export type VendorAvailableRider = {
  id: string;
  fullName?: string;
  phone?: string;
  vehicleType?: string;
  dispatchStatus?: string;
};

function normalizeAvailableRider(raw: unknown): VendorAvailableRider | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id ?? r.riderId ?? r.rider_id;
  if (id == null || str(id) === "") return null;
  return {
    id: str(id),
    fullName: r.fullName != null ? str(r.fullName) : r.full_name != null ? str(r.full_name) : undefined,
    phone: r.phone != null ? str(r.phone) : undefined,
    vehicleType: r.vehicleType != null ? str(r.vehicleType) : r.vehicle_type != null ? str(r.vehicle_type) : undefined,
    dispatchStatus:
      r.dispatchStatus != null ? str(r.dispatchStatus) : r.dispatch_status != null ? str(r.dispatch_status) : undefined,
  };
}

function extractRiderRows(payload: unknown): unknown[] {
  const u = unwrap(payload);
  if (Array.isArray(u)) return u;
  if (u && typeof u === "object") {
    const o = u as Record<string, unknown>;
    for (const k of ["riders", "items", "rows", "data", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

/** GET /vendor/riders/available?storeId= */
export async function getVendorAvailableRiders(storeId: string): Promise<VendorAvailableRider[]> {
  const { data } = await http.get<unknown>("/vendor/riders/available", {
    params: { storeId },
    headers: { "x-store-id": storeId },
  });
  return extractRiderRows(data)
    .map(normalizeAvailableRider)
    .filter((r): r is VendorAvailableRider => r != null);
}

/** POST /vendor/orders/:orderId/assign-rider { riderId } — manual mode, order ready. */
export async function assignVendorOrderRider(orderId: string, riderId: string, storeId: string): Promise<void> {
  await http.post(
    `/vendor/orders/${encodeURIComponent(orderId)}/assign-rider`,
    { riderId },
    { headers: { "x-store-id": storeId }, params: { storeId } },
  );
}

/** PATCH /stores/:storeId/assignment-mode */
export async function patchStoreAssignmentMode(storeId: string, assignmentMode: StoreAssignmentMode): Promise<void> {
  await http.patch(
    `/stores/${encodeURIComponent(storeId)}/assignment-mode`,
    { assignmentMode },
    { skipStoreContext: true },
  );
}

/** Best-effort read for initial UI; falls back to `"auto"` if the store payload omits the field. */
export async function fetchStoreAssignmentMode(storeId: string): Promise<StoreAssignmentMode> {
  try {
    const { data } = await http.get<unknown>(`/stores/${encodeURIComponent(storeId)}`, {
      skipStoreContext: true,
    });
    const body = unwrap(data) as Record<string, unknown>;
    const raw = body.assignmentMode ?? body.assignment_mode;
    const s = String(raw ?? "").toLowerCase();
    return s === "manual" ? "manual" : "auto";
  } catch {
    return "auto";
  }
}
