import { http } from "@/lib/api/client";

function unwrap(data: unknown): unknown {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: unknown }).data;
  }
  return data;
}

/** Backend `order.tracking.step` values (stepper UI). */
export type CustomerOrderTrackingStep =
  | "order_placed"
  | "confirmed"
  | "preparing"
  | "assigned"
  | "on_the_way"
  | "delivered"
  | "delivery_failed"
  | "cancelled";

export type CreateCustomerOrderBody = {
  storeId: string;
  items: { productId: string; quantity: number }[];
  address: { label: string; line: string };
  paymentMethod: "cash" | "card";
  estimatedDeliveryMinutes?: number;
};

export type CustomerOrderTracking = {
  step: CustomerOrderTrackingStep;
  estimatedDeliveryMinutes?: number;
};

export type CustomerOrderLineItem = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CustomerOrderRider = {
  name: string;
  phone?: string;
  vehicle?: string;
};

export type NormalizedCustomerOrder = {
  id: string;
  displayRef: string;
  status: string;
  customerId?: string;
  vendorId?: string;
  tracking: CustomerOrderTracking;
  items: CustomerOrderLineItem[];
  subtotal: number;
  serviceFee?: number;
  deliveryFee: number;
  total: number;
  paymentStatus?: string;
  paymentReference?: string;
  paymentMethod: string;
  storeName?: string;
  addressLabel?: string;
  addressLine?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  rider?: CustomerOrderRider | null;
  createdAt?: string;
  /** Present when `status` / tracking is `delivery_failed` — maps to UI copy. */
  deliveryIssue?: { code: number } | null;
};

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTrackingStep(v: unknown): CustomerOrderTrackingStep {
  const s = str(v)
    .toLowerCase()
    .replace(/-/g, "_");
  const allowed: CustomerOrderTrackingStep[] = [
    "order_placed",
    "confirmed",
    "preparing",
    "assigned",
    "on_the_way",
    "delivered",
    "delivery_failed",
    "cancelled",
  ];
  if (allowed.includes(s as CustomerOrderTrackingStep)) return s as CustomerOrderTrackingStep;
  return "order_placed";
}

function pickOrderRoot(raw: unknown): Record<string, unknown> {
  const u = unwrap(raw);
  if (!u || typeof u !== "object" || Array.isArray(u)) return {};
  const o = u as Record<string, unknown>;
  const nested = o.order;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...o, ...(nested as Record<string, unknown>) };
  }
  return o;
}

function normalizeLineItem(row: Record<string, unknown>): CustomerOrderLineItem {
  const qty = num(row.quantity ?? row.qty, 1);
  const unit = num(row.unitPrice ?? row.unit_price ?? row.price, 0);
  const line = num(row.lineTotal ?? row.line_total ?? row.subtotal ?? row.total, unit * qty);
  return {
    id: str(row.id) || undefined,
    productId: str(row.productId ?? row.product_id) || undefined,
    name: str(row.name ?? row.productName ?? row.product_name ?? row.title ?? "Item"),
    quantity: qty,
    unitPrice: unit,
    lineTotal: line,
  };
}

function normalizeRider(raw: unknown): CustomerOrderRider | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name ?? r.fullName ?? r.full_name);
  if (!name) return null;
  return {
    name,
    phone: str(r.phone ?? r.mobile) || undefined,
    vehicle: str(r.vehicle ?? r.vehicleType ?? r.vehicle_type) || undefined,
  };
}

function readNumOptional(v: unknown): number | undefined {
  if (v == null || String(v).trim() === "") return undefined;
  const n = num(v, NaN);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeCustomerOrder(raw: unknown): NormalizedCustomerOrder {
  const o = pickOrderRoot(raw);
  const trackingRaw =
    o.tracking && typeof o.tracking === "object" && !Array.isArray(o.tracking)
      ? (o.tracking as Record<string, unknown>)
      : {};

  const itemsRaw = o.items ?? o.orderItems ?? o.order_items ?? o.lines;
  const items: CustomerOrderLineItem[] = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((x) => (x && typeof x === "object" ? normalizeLineItem(x as Record<string, unknown>) : null))
        .filter((x): x is CustomerOrderLineItem => x != null)
    : [];

  const orderStatusLower = str(o.status ?? "").toLowerCase();
  let step = normalizeTrackingStep(
    trackingRaw.step ?? o.trackingStep ?? o.tracking_step ?? o.status,
  );
  /** Backend may set `status: delivered` before `tracking.step` catches up on poll. */
  if (orderStatusLower === "delivered") {
    step = "delivered";
  }
  if (orderStatusLower === "cancelled" || orderStatusLower === "canceled") {
    step = "cancelled";
  }
  if (orderStatusLower === "delivery_failed") {
    step = "delivery_failed";
  }

  const issueRaw =
    o.deliveryIssue ?? o.delivery_issue ?? trackingRaw.deliveryIssue ?? trackingRaw.delivery_issue;
  let deliveryIssue: { code: number } | null | undefined;
  if (issueRaw && typeof issueRaw === "object" && !Array.isArray(issueRaw)) {
    const ir = issueRaw as Record<string, unknown>;
    const c = ir.code ?? ir.failureCode ?? ir.failure_code;
    if (c != null && String(c).trim() !== "") {
      deliveryIssue = { code: num(c, 0) };
    }
  } else {
    deliveryIssue = undefined;
  }
  const estRaw = trackingRaw.estimatedDeliveryMinutes ?? trackingRaw.estimated_delivery_minutes;
  let estimatedMinutes: number | undefined;
  if (estRaw != null && String(estRaw).trim() !== "") {
    const n = num(estRaw, NaN);
    if (Number.isFinite(n)) estimatedMinutes = n;
  }

  return {
    id: str(o.id ?? o.orderId ?? o.order_id),
    displayRef: str(o.displayRef ?? o.display_ref ?? o.reference ?? o.id),
    status: str(o.status ?? "pending"),
    customerId: str(o.customerId ?? o.customer_id) || undefined,
    vendorId: str(o.vendorId ?? o.vendor_id) || undefined,
    tracking: {
      step,
      estimatedDeliveryMinutes: estimatedMinutes,
    },
    items,
    subtotal: num(o.subtotal ?? o.subTotal, 0),
    serviceFee: readNumOptional(o.serviceFee ?? o.service_fee),
    deliveryFee: num(o.deliveryFee ?? o.delivery_fee, 0),
    total: num(o.totalAmount ?? o.total_amount ?? o.total ?? o.grandTotal ?? o.grand_total, 0),
    paymentStatus: str(o.paymentStatus ?? o.payment_status) || undefined,
    paymentReference: str(o.paymentReference ?? o.payment_reference ?? o.reference) || undefined,
    paymentMethod: str(o.paymentMethod ?? o.payment_method ?? "cash"),
    storeName: str(o.storeName ?? o.store_name) || undefined,
    ...(() => {
      const addr =
        o.address && typeof o.address === "object" && !Array.isArray(o.address)
          ? (o.address as Record<string, unknown>)
          : {};
      const del =
        o.delivery && typeof o.delivery === "object" && !Array.isArray(o.delivery)
          ? (o.delivery as Record<string, unknown>)
          : {};
      const label = str(addr.label ?? del.label ?? o.addressLabel ?? o.address_label);
      const line = str(
        addr.line ??
          addr.line1 ??
          del.line ??
          del.line1 ??
          o.addressLine ??
          o.address_line ??
          o.deliveryAddress ??
          o.delivery_address,
      );
      return {
        addressLabel: label || undefined,
        addressLine: line || undefined,
      };
    })(),
    rider: normalizeRider(o.rider ?? o.assignedRider ?? o.assigned_rider),
    deliveryLat: readNumOptional(o.deliveryLat ?? o.delivery_lat),
    deliveryLng: readNumOptional(o.deliveryLng ?? o.delivery_lng),
    createdAt: str(o.createdAt ?? o.created_at) || undefined,
    deliveryIssue,
  };
}

/** POST /customers/orders — checkout (customer JWT, profile complete). */
export async function createCustomerOrder(body: CreateCustomerOrderBody): Promise<NormalizedCustomerOrder> {
  const { data } = await http.post<unknown>("/customers/orders", body, { skipStoreContext: true });
  return normalizeCustomerOrder(unwrap(data));
}

/** GET /customers/orders/:orderRef — orderRef is UUID or displayRef (e.g. ord-…). */
export async function getCustomerOrder(orderRef: string): Promise<NormalizedCustomerOrder> {
  const paths = [`/orders/${encodeURIComponent(orderRef)}`, `/customers/orders/${encodeURIComponent(orderRef)}`];
  let last: unknown;
  for (const path of paths) {
    try {
      const { data } = await http.get<unknown>(path, { skipStoreContext: true });
      return normalizeCustomerOrder(unwrap(data));
    } catch (e) {
      last = e;
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 501) continue;
      throw e;
    }
  }
  throw last instanceof Error ? last : new Error("Order not found");
}

export type CustomerOrderListRow = {
  id: string;
  displayRef: string;
  status: string;
  total: number;
  storeName?: string;
  createdAt?: string;
};

export type CustomerOrdersListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function normalizeListRow(o: Record<string, unknown>): CustomerOrderListRow | null {
  const id = str(o.id ?? o.orderId ?? o.order_id);
  if (!id) return null;
  return {
    id,
    displayRef: str(o.displayRef ?? o.display_ref ?? id),
    status: str(o.status ?? "pending"),
    total: num(o.total ?? o.grandTotal ?? o.grand_total, 0),
    storeName: str(o.storeName ?? o.store_name) || undefined,
    createdAt: str(o.createdAt ?? o.created_at) || undefined,
  };
}

/** GET /orders/my — paginated current user order list (with fallback to legacy endpoint). */
export async function listCustomerOrdersPaginated(
  q: { page?: number; limit?: number } = {},
): Promise<{ items: CustomerOrderListRow[]; meta: CustomerOrdersListMeta }> {
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const limit = Math.min(20, Math.max(1, Math.floor(q.limit ?? 20)));
  const paths = ["/orders/my", "/customers/orders"];
  let arr: unknown[] = [];
  let loaded = false;
  let meta: CustomerOrdersListMeta = { page, limit, total: 0, totalPages: 1 };
  let last: unknown;
  for (const path of paths) {
    try {
      const { data } = await http.get<unknown>(path, {
        skipStoreContext: true,
        params: { page, limit },
      });
      const u = unwrap(data);
      if (Array.isArray(u)) {
        arr = u;
        break;
      }
      if (u && typeof u === "object") {
        const o = u as Record<string, unknown>;
        for (const k of ["orders", "items", "data", "results", "rows"]) {
          const v = o[k];
          if (Array.isArray(v)) {
            arr = v;
            break;
          }
        }
        const metaRaw =
          o.meta && typeof o.meta === "object" && !Array.isArray(o.meta)
            ? (o.meta as Record<string, unknown>)
            : o;
        const total = num(metaRaw.total, arr.length);
        const totalPagesFromMeta = num(metaRaw.totalPages ?? metaRaw.total_pages, 0);
        const computedTotalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
        meta = {
          page: Math.max(1, num(metaRaw.page, page)),
          limit: Math.max(1, num(metaRaw.limit, limit)),
          total,
          totalPages: totalPagesFromMeta > 0 ? totalPagesFromMeta : computedTotalPages,
        };
      }
      loaded = true;
      break;
    } catch (e) {
      last = e;
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 501) continue;
      throw e;
    }
  }
  if (!loaded && last) {
    throw last instanceof Error ? last : new Error("Unable to load orders");
  }
  const items = arr
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      /** GET /customers/orders may return `{ items: [ { order: { ... } } ] }`. */
      const payload =
        r.order && typeof r.order === "object" && !Array.isArray(r.order)
          ? (r.order as Record<string, unknown>)
          : r;
      const normalized = normalizeListRow(payload);
      if (!normalized) return null;
      return {
        ...normalized,
        total: num(
          payload.totalAmount ??
            payload.total_amount ??
            payload.total ??
            payload.grandTotal ??
            payload.grand_total,
          normalized.total,
        ),
      };
    })
    .filter((x): x is CustomerOrderListRow => x != null);
  if (!loaded || meta.total === 0) {
    meta = {
      page,
      limit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / Math.max(limit, 1))),
    };
  }
  return { items, meta };
}

/** Backward-compatible helper when only rows are needed. */
export async function listCustomerOrders(): Promise<CustomerOrderListRow[]> {
  const { items } = await listCustomerOrdersPaginated();
  return items;
}
