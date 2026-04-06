import axios from "axios";
import { http } from "@/lib/api/client";

function unwrap(data: unknown): unknown {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: unknown }).data;
  }
  return data;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Math.max(0, Math.floor(Number(v)));
  }
  return undefined;
}

function pick(
  o: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const k of keys) {
    const v = o[k];
    const n = num(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

/** Normalized stats for the admin home dashboard (flexible backend shapes). */
export type AdminOverview = {
  vendors: number;
  riders: number;
  customers: number;
  admins: number;
  orders: number;
  pendingVendors: number;
  /** Optional daily points for area chart */
  activity: { date: string; label: string; count: number }[];
};

const emptyOverview = (): AdminOverview => ({
  vendors: 0,
  riders: 0,
  customers: 0,
  admins: 0,
  orders: 0,
  pendingVendors: 0,
  activity: [],
});

export function normalizeAdminOverview(raw: unknown): AdminOverview {
  if (raw == null || typeof raw !== "object") return emptyOverview();
  const o = raw as Record<string, unknown>;
  const merged = { ...o };
  if (o.counts && typeof o.counts === "object") {
    Object.assign(merged, o.counts as object);
  }
  if (o.stats && typeof o.stats === "object") {
    Object.assign(merged, o.stats as object);
  }
  if (o.totals && typeof o.totals === "object") {
    Object.assign(merged, o.totals as object);
  }

  const vendors =
    pick(merged, ["vendors", "vendorCount", "totalVendors", "stores"]) ??
    nested(merged, ["byRole", "vendor"]) ??
    nested(merged, ["usersByRole", "vendor"]) ??
    0;
  const riders =
    pick(merged, ["riders", "riderCount", "totalRiders"]) ??
    nested(merged, ["byRole", "rider"]) ??
    nested(merged, ["usersByRole", "rider"]) ??
    0;
  const customers =
    pick(merged, ["customers", "customerCount", "totalCustomers", "users"]) ??
    nested(merged, ["byRole", "customer"]) ??
    nested(merged, ["usersByRole", "customer"]) ??
    0;
  const admins =
    pick(merged, ["admins", "adminCount", "totalAdmins"]) ??
    nested(merged, ["byRole", "admin"]) ??
    nested(merged, ["usersByRole", "admin"]) ??
    0;
  const orders = pick(merged, ["orders", "orderCount", "totalOrders"]) ?? 0;
  const pendingVendors =
    pick(merged, ["pendingVendors", "vendorsPending", "pendingVendorCount"]) ?? 0;

  let activity: AdminOverview["activity"] = [];
  const series = merged.activity ?? merged.signupsByDay ?? merged.daily ?? merged.timeSeries;
  if (Array.isArray(series)) {
    activity = series
      .map((item, i) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const date = String(row.date ?? row.day ?? row.label ?? `Day ${i + 1}`);
        const label = String(row.label ?? row.date ?? date).slice(0, 10);
        const count = num(row.count ?? row.value ?? row.users ?? row.signups) ?? 0;
        return { date, label, count };
      })
      .filter(Boolean) as AdminOverview["activity"];
  }

  return {
    vendors,
    riders,
    customers,
    admins,
    orders,
    pendingVendors,
    activity,
  };
}

function nested(root: Record<string, unknown>, path: string[]): number | undefined {
  let cur: unknown = root;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return num(cur);
}

/**
 * Global admin metrics. Backend: implement GET /admin/overview (or adjust path below) returning
 * counts and optional `activity` / `signupsByDay` arrays for charts. See `normalizeAdminOverview`.
 */
export async function fetchAdminOverview(): Promise<{ overview: AdminOverview; notFound: boolean }> {
  try {
    const { data } = await http.get<unknown>("/admin/overview");
    return { overview: normalizeAdminOverview(unwrap(data)), notFound: false };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { overview: emptyOverview(), notFound: true };
    }
    throw e;
  }
}
