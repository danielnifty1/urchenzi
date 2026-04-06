/** Normalize admin vendor API payloads (camelCase + snake_case). */

export function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

function pick(obj: Record<string, unknown>, camel: string, snake: string): unknown {
  return obj[camel] ?? obj[snake];
}

export function getStr(obj: Record<string, unknown>, camel: string, snake: string): string {
  const v = pick(obj, camel, snake);
  if (v == null) return "";
  return String(v);
}

export function getNum(obj: Record<string, unknown>, camel: string, snake: string): number | undefined {
  const v = pick(obj, camel, snake);
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function getBool(obj: Record<string, unknown>, camel: string, snake: string): boolean {
  const v = pick(obj, camel, snake);
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return false;
}

/** Settings object from GET settings or nested in dashboard. */
export function extractSettingsBlob(raw: unknown): Record<string, unknown> {
  const o = asRecord(raw);
  const nested = o.settings ?? o.storeSettings;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as object) };
  }
  return o;
}

export function extractFeaturesBlob(raw: unknown): Record<string, unknown> {
  const o = asRecord(raw);
  const nested = o.features ?? o.featureFlags;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as object) };
  }
  return o;
}

export function extractMetricsBlob(raw: unknown): Record<string, unknown> {
  const o = asRecord(raw);
  const nested = o.metrics ?? o.stats ?? o.counts;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as object) };
  }
  return {};
}

export type VendorDashboardParts = {
  settings: Record<string, unknown>;
  features: Record<string, unknown>;
  metrics: Record<string, unknown>;
  raw: Record<string, unknown>;
};

export function parseVendorDashboard(raw: unknown): VendorDashboardParts {
  const root = asRecord(raw);
  const settings =
    root.settings && typeof root.settings === "object" ? asRecord(root.settings) : extractSettingsBlob(raw);
  const features =
    root.features && typeof root.features === "object" ? asRecord(root.features) : {};
  const metrics =
    root.metrics && typeof root.metrics === "object" ? asRecord(root.metrics) : extractMetricsBlob(raw);
  return { settings, features, metrics, raw: root };
}

/** Best-effort linked owner / user status from dashboard payload (snake or camel). */
export function pickLinkedUserStatus(raw: Record<string, unknown>): string | null {
  const nestedKeys = ["user", "owner", "vendorUser", "linkedUser", "storeOwner"] as const;
  for (const key of nestedKeys) {
    const c = raw[key];
    if (c && typeof c === "object" && !Array.isArray(c)) {
      const o = c as Record<string, unknown>;
      const s = o.status ?? o.userStatus;
      if (s != null && String(s).trim() !== "") return String(s).toLowerCase();
    }
  }
  const top = raw.userStatus ?? raw.ownerStatus ?? raw.accountStatus ?? raw.linkedUserStatus;
  if (top != null && String(top).trim() !== "") return String(top).toLowerCase();
  return null;
}

/** Vendor entity / application status from dashboard (camel or snake, nested vendor or onboarding). */
export function pickVendorRecordStatus(raw: Record<string, unknown>): string | null {
  const top =
    raw.vendorStatus ??
    raw.vendor_status ??
    raw.applicationStatus ??
    raw.application_status ??
    raw.storeStatus ??
    raw.store_status;
  if (top != null && String(top).trim() !== "") return String(top).toLowerCase();

  const vendor = raw.vendor;
  if (vendor && typeof vendor === "object" && !Array.isArray(vendor)) {
    const s = (vendor as Record<string, unknown>).status;
    if (s != null && String(s).trim() !== "") return String(s).toLowerCase();
  }

  const ob = raw.onboarding ?? raw.vendorOnboarding ?? raw.vendor_onboarding;
  if (ob && typeof ob === "object" && !Array.isArray(ob)) {
    const s = (ob as Record<string, unknown>).status;
    if (s != null && String(s).trim() !== "") return String(s).toLowerCase();
  }

  return null;
}

export function pickVendorRejectionReason(raw: Record<string, unknown>): string | null {
  const ob = raw.onboarding ?? raw.vendorOnboarding ?? raw.vendor_onboarding;
  if (ob && typeof ob === "object" && !Array.isArray(ob)) {
    const o = ob as Record<string, unknown>;
    const r = o.rejectionReason ?? o.rejection_reason;
    if (r != null && String(r).trim() !== "") return String(r);
  }
  return null;
}

const PRODUCT_LIST_ARRAY_KEYS = [
  "items",
  "data",
  "products",
  "results",
  "content",
  "records",
  "rows",
  "list",
] as const;

function asObjectRows(arr: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(arr)) return null;
  if (arr.length === 0) return [];
  const rows = arr.filter((x): x is Record<string, unknown> =>
    Boolean(x && typeof x === "object" && !Array.isArray(x)),
  );
  return rows.length > 0 ? rows : null;
}

/** Pull product rows from admin/vendor list payloads (paginated or plain). */
export function extractProductRowsFromListPayload(raw: unknown): Record<string, unknown>[] {
  function scan(node: unknown, depth: number): Record<string, unknown>[] | null {
    if (depth > 10 || node == null) return null;

    const asArr = asObjectRows(node);
    if (asArr !== null) return asArr;

    if (typeof node !== "object" || Array.isArray(node)) return null;
    const o = node as Record<string, unknown>;

    for (const key of PRODUCT_LIST_ARRAY_KEYS) {
      if (!(key in o)) continue;
      const v = o[key];
      const got = asObjectRows(v);
      if (got !== null) return got;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = scan(v, depth + 1);
        if (nested !== null) return nested;
      }
    }

    if (Array.isArray(o.edges)) {
      const relay = o.edges
        .map((e) => {
          if (e && typeof e === "object" && "node" in e) {
            const n = (e as { node: unknown }).node;
            if (n && typeof n === "object" && !Array.isArray(n)) return n as Record<string, unknown>;
          }
          return null;
        })
        .filter((x): x is Record<string, unknown> => x !== null);
      if (relay.length > 0 || o.edges.length === 0) return relay;
    }

    if (o.data !== undefined) {
      const nested = scan(o.data, depth + 1);
      if (nested !== null) return nested;
    }

    return null;
  }

  return scan(raw, 0) ?? [];
}

export function parseAdminVendorProductList(raw: unknown): {
  rows: Record<string, unknown>[];
  nextCursor: string | null;
} {
  const rows = extractProductRowsFromListPayload(raw);
  let nextCursor: string | null = null;
  const pickCursor = (o: unknown) => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return;
    const r = o as Record<string, unknown>;
    const n = r.nextCursor ?? r.next_cursor ?? r.cursor ?? r.nextPage ?? r.next_page;
    if (n != null && String(n).trim() !== "") nextCursor = String(n);
  };
  pickCursor(raw);
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    pickCursor(o.data);
    pickCursor(o.meta);
    const meta = o.meta;
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      pickCursor((meta as Record<string, unknown>).pagination);
    }
  }
  return { rows, nextCursor };
}

export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/** Known feature flags — labels for admin UI; other boolean keys still render. */
export const VENDOR_FEATURE_META: Record<string, { label: string; description: string }> = {
  onlineOrdering: {
    label: "Online ordering",
    description: "Customers can place orders through the storefront.",
  },
  scheduledOrders: {
    label: "Scheduled orders",
    description: "Allow ordering for a future time slot.",
  },
  promoBanners: {
    label: "Promo banners",
    description: "Show promotional banners in the store experience.",
  },
  customerNotifications: {
    label: "Customer notifications",
    description: "Send updates to customers about their orders.",
  },
  analyticsEmails: {
    label: "Analytics emails",
    description: "Email summaries and analytics to the merchant.",
  },
  autoAcceptOrders: {
    label: "Auto-accept orders",
    description: "Automatically accept incoming orders without manual approval.",
  },
};

export const STORE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select category" },
  { value: "restaurants", label: "Restaurants" },
  { value: "groceries", label: "Groceries" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "shops", label: "Shops" },
  { value: "flowers", label: "Flowers" },
  { value: "supermarkets", label: "Supermarkets" },
  { value: "alcohol", label: "Alcohol" },
  { value: "quick-commerce", label: "Quick commerce" },
  { value: "food", label: "Food" },
];
