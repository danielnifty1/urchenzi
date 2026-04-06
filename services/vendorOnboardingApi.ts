import { http } from "@/lib/api/client";

export type VendorOnboardingStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected";

export type VendorOnboardingDocument = {
  id: string;
  type: string;
  url: string;
};

export type VendorOnboardingResponse = {
  status: VendorOnboardingStatus;
  storeName?: string;
  category?: string;
  businessType?: string;
  hours?: { open: string; close: string };
  serviceAreas?: string[];
  bankName?: string;
  accountHolder?: string;
  /** Masked when stored; never full number from GET. */
  bankAccount?: string;
  bankAccountLast4?: string;
  validationErrors?: Record<string, string[]>;
  documents?: VendorOnboardingDocument[];
  rejectionReason?: string | null;
};

export type VendorOnboardingPatch = {
  storeName?: string;
  category?: string;
  businessType?: "new" | "existing" | string;
  hours?: { open: string; close: string };
  serviceAreas?: string[];
  bankName?: string;
  accountHolder?: string;
  /** Plain digits only when setting or updating bank account. */
  bankAccount?: string;
};

function unwrapData<T extends Record<string, unknown>>(data: T): T {
  const inner = data.data as T | undefined;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner;
  }
  return data;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v);
  return s === "" ? undefined : s;
}

function normalizeDoc(raw: Record<string, unknown>): VendorOnboardingDocument {
  return {
    id: String(raw.id ?? ""),
    type: String(raw.type ?? ""),
    url: String(raw.url ?? ""),
  };
}

export function normalizeVendorOnboarding(raw: Record<string, unknown>): VendorOnboardingResponse {
  const h = raw.hours as Record<string, unknown> | undefined;
  const hours =
    h && (h.open != null || h.close != null)
      ? {
          open: String(h.open ?? "09:00"),
          close: String(h.close ?? "21:00"),
        }
      : undefined;

  const areas = raw.serviceAreas ?? raw.service_areas;
  const serviceAreas = Array.isArray(areas)
    ? areas.map((a) => String(a))
    : undefined;

  const docsRaw = raw.documents ?? raw.documentList;
  const documents = Array.isArray(docsRaw)
    ? (docsRaw as Record<string, unknown>[]).map((d) => normalizeDoc(d))
    : undefined;

  return {
    status: (String(raw.status ?? "not_started") as VendorOnboardingStatus) || "not_started",
    storeName: str(raw.storeName ?? raw.store_name),
    category: str(raw.category),
    businessType: str(raw.businessType ?? raw.business_type),
    hours,
    serviceAreas,
    bankName: str(raw.bankName ?? raw.bank_name),
    accountHolder: str(raw.accountHolder ?? raw.account_holder),
    bankAccount: str(raw.bankAccount ?? raw.bank_account),
    bankAccountLast4: str(raw.bankAccountLast4 ?? raw.bank_account_last4),
    validationErrors: (raw.validationErrors ?? raw.validation_errors) as
      | Record<string, string[]>
      | undefined,
    documents,
    rejectionReason:
      raw.rejectionReason != null || raw.rejection_reason != null
        ? String(raw.rejectionReason ?? raw.rejection_reason)
        : null,
  };
}

export async function getVendorOnboarding(): Promise<VendorOnboardingResponse> {
  const { data } = await http.get<Record<string, unknown>>("/vendor/onboarding");
  return normalizeVendorOnboarding(unwrapData(data as Record<string, unknown>));
}

export async function patchVendorOnboarding(
  patch: VendorOnboardingPatch,
): Promise<VendorOnboardingResponse> {
  const { data } = await http.patch<Record<string, unknown>>("/vendor/onboarding", patch);
  return normalizeVendorOnboarding(unwrapData(data as Record<string, unknown>));
}

export async function submitVendorOnboarding(): Promise<VendorOnboardingResponse> {
  const { data } = await http.post<Record<string, unknown> | undefined>(
    "/vendor/onboarding/submit",
  );
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return getVendorOnboarding();
  }
  return normalizeVendorOnboarding(unwrapData(data as Record<string, unknown>));
}

/** Backend document type (multipart `type` field). */
export type VendorOnboardingDocumentType =
  | "business_registration"
  | "tax_id"
  | "store_photo"
  | "owner_id";

export async function uploadVendorOnboardingDocument(
  type: VendorOnboardingDocumentType,
  file: File,
): Promise<{ id: string; url: string; type: string }> {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  const { data } = await http.post<{ id: string; url: string; type: string }>(
    "/vendor/onboarding/documents",
    form,
  );
  return data;
}

export async function deleteVendorOnboardingDocument(documentId: string): Promise<void> {
  await http.delete(`/vendor/onboarding/documents/${documentId}`);
}
