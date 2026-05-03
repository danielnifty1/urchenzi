import { http } from "@/lib/api/client";
import type { StoreImageInput } from "@/types/vendorStore";

export type RiderVehicleType = "bike" | "car";

/** POST /riders/me/onboarding/documents — `type` must match backend `UploadRiderDocumentDto`. */
export type RiderDocumentType =
  | "drivers_license"
  | "vehicle_registration"
  | "insurance"
  | "proof_of_address";

export type RiderOnboardingDocumentImage = Pick<StoreImageInput, "data" | "fileName" | "mimeType">;

export async function uploadRiderOnboardingDocument(
  type: RiderDocumentType,
  image: RiderOnboardingDocumentImage,
): Promise<RiderMutationResult> {
  const { data } = await http.post<unknown>(
    "/riders/me/onboarding/documents",
    { type, image },
    { skipStoreContext: true },
  );
  return parseRiderMutationResponse(data);
}

export type RiderDispatchStatus = "available" | "busy" | "offline";

/** KYC / onboarding gate for dashboard and dispatch (see RidersService / entity). */
export type RiderKycStatus = "pending" | "approved" | "rejected";

export type RiderMe = {
  id?: string;
  fullName: string;
  phone: string;
  vehicleType: RiderVehicleType;
  plateNumber: string;
  licenseUrl: string;
  /** Rider can receive work when true (backend also derives dispatchStatus). */
  isActive: boolean;
  dispatchStatus: RiderDispatchStatus;
  currentLat?: number | null;
  currentLng?: number | null;
  /** When set, `/rider/dashboard` requires `approved`. Omitted on older APIs → treated as approved. */
  status?: RiderKycStatus;
  /** False until all four document URLs exist on the rider (see `onboardingMissing`). Omitted → treated as complete (legacy). */
  onboardingComplete?: boolean;
  /** Slot ids still missing when `onboardingComplete` is false. */
  onboardingMissing?: RiderDocumentType[];
  vehicleRegistrationUrl?: string;
  insuranceUrl?: string;
  proofOfAddressUrl?: string;
  /**
   * True when an approved rider changed vital KYC fields and the profile is paused for admin re-approval.
   * API may send `pendingProfileReview` (alias of revalidationPending).
   */
  revalidationPending?: boolean;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankCode?: string;
};

/** PATCH /riders/me and POST /riders/me/onboarding/documents may include `message` when profile was paused for review. */
export type RiderMutationResult = {
  rider: RiderMe;
  message?: string;
};

/** Order lifecycle on the platform (vendor + rider). `in_transit` = rider accepted / en route (POST …/delivered completes). */
export type RiderOrderStatus =
  | "pending"
  | "accepted"
  | "ready"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "delivery_failed"
  | "cancelled";

export type RiderOrder = {
  id: string;
  status: RiderOrderStatus;
  storeId?: string;
  referenceCode?: string;
  total?: number;
  createdAt?: string;
  /** Present after rider accepts (if backend sends it). */
  riderAcceptedAt?: string | null;
  pickupAddress?: string;
  dropoffAddress?: string;
};

export type DeliveryStatus = "assigned" | "in_progress" | "completed";

export type RiderDelivery = {
  id: string;
  status: DeliveryStatus;
  orderId?: string;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  notes?: string;
};

export type RiderDeliveryAction = "accept" | "picked_up" | "delivered";

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

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeVehicleType(v: unknown): RiderVehicleType {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "car") return "car";
  return "bike";
}

function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return fallback;
}

function normalizeDispatchStatus(v: unknown, isActive: boolean): RiderDispatchStatus {
  const s = String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  if (s === "available" || s === "busy" || s === "offline") return s as RiderDispatchStatus;
  return isActive ? "available" : "offline";
}

function normalizeRiderKycStatus(v: unknown): RiderKycStatus | undefined {
  const s = String(v ?? "")
    .toLowerCase()
    .trim();
  if (s === "pending" || s === "approved" || s === "rejected") return s;
  return undefined;
}

const RIDER_DOC_SLOT_SET = new Set<RiderDocumentType>([
  "drivers_license",
  "vehicle_registration",
  "insurance",
  "proof_of_address",
]);

function normalizeOnboardingMissing(v: unknown): RiderDocumentType[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: RiderDocumentType[] = [];
  for (const x of v) {
    const s = String(x ?? "").trim();
    if (RIDER_DOC_SLOT_SET.has(s as RiderDocumentType)) out.push(s as RiderDocumentType);
  }
  return out.length ? out : undefined;
}

function normalizeRevalidationPending(o: Record<string, unknown>): boolean | undefined {
  const v =
    o.revalidationPending ??
    o.revalidation_pending ??
    o.pendingProfileReview ??
    o.pending_profile_review;
  if (v === undefined || v === null) return undefined;
  return asBool(v, false);
}

function parseRiderMutationResponse(raw: unknown): RiderMutationResult {
  const u = unwrap(raw);
  const top = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  let msg = str(top.message ?? top.notice).trim();
  if (!msg && top.rider && typeof top.rider === "object") {
    const r = top.rider as Record<string, unknown>;
    msg = str(r.message ?? r.notice).trim();
  }
  return { rider: normalizeRider(u), message: msg || undefined };
}

function normalizeRider(raw: unknown): RiderMe {
  const root = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const nested = root.rider;
  const o = (
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? { ...root, ...(nested as Record<string, unknown>) }
      : root
  ) as Record<string, unknown>;
  const isActive = asBool(o.isActive ?? o.is_active ?? o.isOnline ?? o.is_online, false);
  const kyc = normalizeRiderKycStatus(o.status ?? o.riderStatus ?? o.rider_status ?? o.kycStatus ?? o.kyc_status);
  const ocRaw = o.onboardingComplete ?? o.onboarding_complete;
  const onboardingComplete = typeof ocRaw === "boolean" ? ocRaw : undefined;
  const rev = normalizeRevalidationPending(o);
  return {
    id: str(o.id) || undefined,
    fullName: str(o.fullName ?? o.full_name ?? o.name),
    phone: str(o.phone),
    vehicleType: normalizeVehicleType(o.vehicleType ?? o.vehicle_type),
    plateNumber: str(o.plateNumber ?? o.plate_number),
    licenseUrl: str(o.licenseUrl ?? o.license_url),
    isActive,
    dispatchStatus: normalizeDispatchStatus(o.dispatchStatus ?? o.dispatch_status, isActive),
    status: kyc,
    currentLat:
      o.currentLat != null
        ? num(o.currentLat)
        : o.current_lat != null
          ? num(o.current_lat)
          : undefined,
    currentLng:
      o.currentLng != null
        ? num(o.currentLng)
        : o.current_lng != null
          ? num(o.current_lng)
          : undefined,
    onboardingComplete,
    onboardingMissing: normalizeOnboardingMissing(o.onboardingMissing ?? o.onboarding_missing),
    vehicleRegistrationUrl:
      str(o.vehicleRegistrationUrl ?? o.vehicle_registration_url) || undefined,
    insuranceUrl: str(o.insuranceUrl ?? o.insurance_url) || undefined,
    proofOfAddressUrl: str(o.proofOfAddressUrl ?? o.proof_of_address_url) || undefined,
    bankName: str(o.bankName ?? o.bank_name) || undefined,
    bankAccountName: str(o.bankAccountName ?? o.bank_account_name) || undefined,
    bankAccountNumber: str(o.bankAccountNumber ?? o.bank_account_number) || undefined,
    bankCode: str(o.bankCode ?? o.bank_code) || undefined,
    ...(rev === true ? { revalidationPending: true } : rev === false ? { revalidationPending: false } : {}),
  };
}

/** POST /riders/onboard — creates rider row (after profile complete, before document uploads). */
export type PostRidersOnboardPayload = {
  phone: string;
  vehicleType: RiderVehicleType;
  plateNumber: string;
};

export async function postRidersOnboard(payload: PostRidersOnboardPayload): Promise<RiderMe | undefined> {
  const { data } = await http.post<unknown>(
    "/riders/onboard",
    {
      phone: payload.phone.trim(),
      vehicleType: payload.vehicleType,
      plateNumber: payload.plateNumber.trim(),
    },
    { skipStoreContext: true },
  );
  const raw = unwrap(data);
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    return undefined;
  }
  return normalizeRider(raw);
}

/** Map onboarding UI vehicle options to API `bike` | `car`. */
export function mapVehicleFormToRiderVehicleType(formValue: string): RiderVehicleType {
  const v = formValue.toLowerCase().trim();
  if (v === "car" || v === "van") return "car";
  return "bike";
}

export async function getRiderMe(): Promise<RiderMe> {
  const { data } = await http.get<unknown>("/riders/me", { skipStoreContext: true });
  return normalizeRider(unwrap(data));
}

export type PatchRiderMePayload = Partial<{
  fullName: string;
  phone: string;
  vehicleType: RiderVehicleType;
  plateNumber: string;
  licenseUrl: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
}>;

export async function patchRiderMe(patch: PatchRiderMePayload): Promise<RiderMutationResult> {
  const body: Record<string, unknown> = {};
  if (patch.fullName !== undefined) body.fullName = patch.fullName;
  if (patch.phone !== undefined) body.phone = patch.phone;
  if (patch.vehicleType !== undefined) body.vehicleType = patch.vehicleType;
  if (patch.plateNumber !== undefined) body.plateNumber = patch.plateNumber;
  if (patch.licenseUrl !== undefined) body.licenseUrl = patch.licenseUrl;
  if (patch.bankName !== undefined) body.bankName = patch.bankName;
  if (patch.bankAccountName !== undefined) body.bankAccountName = patch.bankAccountName;
  if (patch.bankAccountNumber !== undefined) body.bankAccountNumber = patch.bankAccountNumber;
  if (patch.bankCode !== undefined) body.bankCode = patch.bankCode;

  const { data } = await http.patch<unknown>("/riders/me", body, { skipStoreContext: true });
  return parseRiderMutationResponse(data);
}

/** Sets `isActive`; backend updates `dispatchStatus` (cannot force “available” while busy). */
export async function patchRiderAvailability(isActive: boolean): Promise<RiderMe> {
  const { data } = await http.patch<unknown>(
    "/riders/me/availability",
    { isActive },
    { skipStoreContext: true },
  );
  return normalizeRider(unwrap(data));
}

export async function patchRiderLocation(lat: number, lng: number): Promise<RiderMe> {
  const { data } = await http.patch<unknown>(
    "/riders/me/location",
    { lat, lng },
    { skipStoreContext: true },
  );
  return normalizeRider(unwrap(data));
}

function normalizeRiderOrderStatus(v: unknown): RiderOrderStatus {
  const s = String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  const allowed: RiderOrderStatus[] = [
    "pending",
    "accepted",
    "ready",
    "assigned",
    "in_transit",
    "delivered",
    "delivery_failed",
    "cancelled",
  ];
  if (allowed.includes(s as RiderOrderStatus)) return s as RiderOrderStatus;
  if (s === "preparing" || s === "processing") return "ready";
  if (s === "completed" || s === "done") return "delivered";
  return "pending";
}

function extractOrderRows(payload: unknown): unknown[] {
  const u = unwrap(payload);
  if (Array.isArray(u)) return u;
  if (u && typeof u === "object") {
    const o = u as Record<string, unknown>;
    for (const k of ["orders", "items", "rows", "data", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function normalizeRiderOrder(raw: unknown): RiderOrder | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!o) return null;
  const id = str(o.id);
  if (!id) return null;
  const ra =
    o.riderAcceptedAt ?? o.rider_accepted_at ?? o.acceptedAt ?? o.accepted_at ?? o.riderAccepted ?? null;
  const riderAcceptedAt = ra != null && String(ra).trim() !== "" ? str(ra) : null;
  let status = normalizeRiderOrderStatus(o.status ?? o.state);
  /** Rider accepted the run → `in_transit` (API may still send `assigned` or conflate with vendor `accepted`). */
  if (
    status !== "delivery_failed" &&
    status !== "cancelled" &&
    riderAcceptedAt &&
    status !== "delivered" &&
    status !== "in_transit" &&
    (status === "assigned" || status === "accepted")
  ) {
    status = "in_transit";
  }
  return {
    id,
    status,
    storeId: str(o.storeId ?? o.store_id) || undefined,
    referenceCode: str(o.referenceCode ?? o.reference_code) || undefined,
    total: o.total != null ? num(o.total) : o.amount != null ? num(o.amount) : undefined,
    createdAt: str(o.createdAt ?? o.created_at ?? o.placedAt ?? o.placed_at) || undefined,
    riderAcceptedAt,
    pickupAddress: str(o.pickupAddress ?? o.pickup_address) || undefined,
    dropoffAddress: str(o.dropoffAddress ?? o.dropoff_address ?? o.deliveryAddress ?? o.delivery_address) || undefined,
  };
}

export async function getRiderOrders(): Promise<RiderOrder[]> {
  const { data } = await http.get<unknown>("/riders/me/orders", { skipStoreContext: true });
  return extractOrderRows(data)
    .map(normalizeRiderOrder)
    .filter((o): o is RiderOrder => o != null);
}

export async function postRiderOrderAccept(orderId: string): Promise<void> {
  await http.post(
    `/riders/me/orders/${encodeURIComponent(orderId)}/accept`,
    {},
    { skipStoreContext: true },
  );
}

export async function postRiderOrderReject(orderId: string): Promise<void> {
  await http.post(
    `/riders/me/orders/${encodeURIComponent(orderId)}/reject`,
    {},
    { skipStoreContext: true },
  );
}

export async function postRiderOrderDelivered(orderId: string): Promise<void> {
  await http.post(
    `/riders/me/orders/${encodeURIComponent(orderId)}/delivered`,
    {},
    { skipStoreContext: true },
  );
}

export type ReportDeliveryFailureDto = {
  /** Required failure reason code (backend contract). */
  code: number;
  note?: string;
};

export async function postRiderOrderDeliveryFailed(
  orderId: string,
  body: ReportDeliveryFailureDto,
): Promise<void> {
  await http.post(
    `/riders/me/orders/${encodeURIComponent(orderId)}/delivery-failed`,
    body,
    { skipStoreContext: true },
  );
}

function normalizeDeliveryStatus(v: unknown): DeliveryStatus {
  const s = String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  if (s === "assigned" || s === "in_progress" || s === "completed") return s;
  return "assigned";
}

function extractDeliveryRows(payload: unknown): unknown[] {
  const u = unwrap(payload);
  if (Array.isArray(u)) return u;
  if (u && typeof u === "object") {
    const o = u as Record<string, unknown>;
    for (const k of ["deliveries", "items", "rows", "data", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function normalizeDelivery(raw: unknown): RiderDelivery | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!o) return null;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    status: normalizeDeliveryStatus(o.status),
    orderId: str(o.orderId ?? o.order_id) || undefined,
    acceptedAt: o.acceptedAt != null ? str(o.acceptedAt) : o.accepted_at != null ? str(o.accepted_at) : null,
    pickedUpAt: o.pickedUpAt != null ? str(o.pickedUpAt) : o.picked_up_at != null ? str(o.picked_up_at) : null,
    deliveredAt:
      o.deliveredAt != null ? str(o.deliveredAt) : o.delivered_at != null ? str(o.delivered_at) : null,
    pickupAddress: str(o.pickupAddress ?? o.pickup_address) || undefined,
    dropoffAddress: str(o.dropoffAddress ?? o.dropoff_address ?? o.deliveryAddress ?? o.delivery_address) || undefined,
    notes: str(o.notes) || undefined,
  };
}

export type RiderDeliveriesStatusQuery = DeliveryStatus | undefined;

export async function getRiderDeliveries(status?: RiderDeliveriesStatusQuery): Promise<RiderDelivery[]> {
  const { data } = await http.get<unknown>("/riders/me/deliveries", {
    skipStoreContext: true,
    params: status ? { status } : undefined,
  });
  return extractDeliveryRows(data)
    .map(normalizeDelivery)
    .filter((d): d is RiderDelivery => d != null);
}

export async function patchRiderDelivery(
  deliveryId: string,
  action: RiderDeliveryAction,
): Promise<RiderDelivery> {
  const { data } = await http.patch<unknown>(
    `/riders/me/deliveries/${encodeURIComponent(deliveryId)}`,
    { action },
    { skipStoreContext: true },
  );
  const raw = unwrap(data);
  let row = normalizeDelivery(raw);
  if (!row && raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    row = normalizeDelivery(o.delivery ?? o.data ?? o.result);
  }
  if (!row) {
    throw new Error("Invalid delivery response");
  }
  return row;
}
