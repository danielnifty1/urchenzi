import axios from "axios";
import { http } from "@/lib/api/client";

function unwrap(data: unknown): unknown {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: unknown }).data;
  }
  return data;
}

export type AdminListRow = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  /** From admin directory when backend includes it (e.g. riders). */
  rejectionReason?: string;
  /** Rider profile paused for admin re-approval after vital-field changes (approved riders only). */
  revalidationPending?: boolean;
};

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function rowFromObject(o: Record<string, unknown>): AdminListRow {
  const id = str(o.id ?? o.userid ?? o.userId ?? o.vendorId ?? o.uuid);
  const first = str(o.firstName);
  const last = str(o.lastName);
  const combined = [first, last].filter(Boolean).join(" ").trim();
  const name =
    combined ||
    str(o.name) ||
    str(o.fullName) ||
    str(o.storeName) ||
    str(o.businessName) ||
    str(o.title) ||
    "(no name)";
  const rr = str(o.rejectionReason ?? o.rejection_reason);
  const revRaw = o.revalidationPending ?? o.revalidation_pending ?? o.pendingProfileReview ?? o.pending_profile_review;
  const revalidationPending =
    revRaw === true || revRaw === "true" || revRaw === 1 ? true : revRaw === false || revRaw === 0 ? false : undefined;
  return {
    id,
    name,
    email: str(o.email) || undefined,
    role: str(o.role) || undefined,
    status: str(o.status) || undefined,
    rejectionReason: rr || undefined,
    ...(revalidationPending === true ? { revalidationPending: true } : {}),
  };
}

function normalizeList(raw: unknown, kind: "vendors" | "riders" | "users"): AdminListRow[] {
  const data = unwrap(raw);
  let arr: unknown[] = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const keys =
      kind === "vendors"
        ? ["items", "vendors", "data", "results", "rows"]
        : kind === "riders"
          ? ["items", "riders", "data", "results", "rows"]
          : ["items", "users", "data", "results", "rows"];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) {
        arr = v;
        break;
      }
    }
  }

  return arr
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      if (o.user && typeof o.user === "object") {
        const u = o.user as Record<string, unknown>;
        return rowFromObject({ ...u, ...o, id: o.id ?? u.id });
      }
      if (o.vendor && typeof o.vendor === "object") {
        const v = o.vendor as Record<string, unknown>;
        return rowFromObject({ ...v, ...o, id: o.id ?? v.id });
      }
      if (o.rider && typeof o.rider === "object") {
        const r = o.rider as Record<string, unknown>;
        return rowFromObject({ ...r, ...o, id: o.id ?? r.id });
      }
      return rowFromObject(o);
    })
    .filter((r): r is AdminListRow => Boolean(r?.id));
}

export type DirectoryFetchResult = {
  rows: AdminListRow[];
  notFound: boolean;
  message?: string;
};

async function getList(
  path: string,
  kind: "vendors" | "riders" | "users",
  params?: Record<string, string | number | boolean | undefined>,
): Promise<DirectoryFetchResult> {
  try {
    const { data } = await http.get<unknown>(path, { params });
    return { rows: normalizeList(data, kind), notFound: false };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { rows: [], notFound: true, message: "Endpoint not implemented (404)." };
    }
    throw e;
  }
}

/** GET /admin/vendors — paginate with query params if your DTO supports them. */
export function fetchAdminVendors(params?: Record<string, string | number | boolean | undefined>) {
  return getList("/admin/vendors", "vendors", params);
}

/** GET /admin/riders */
export function fetchAdminRiders(params?: Record<string, string | number | boolean | undefined>) {
  return getList("/admin/riders", "riders", params);
}

export { fetchAdminRiderById } from "./adminRiderApi";

/** GET /admin/users — optional role filter (e.g. customer, vendor, rider, admin). */
export function fetchAdminUsers(params?: Record<string, string | number | boolean | undefined>) {
  return getList("/admin/users", "users", params);
}
