import { http } from "@/lib/api/client";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data?: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = str(v).toLowerCase();
  return s === "true" || s === "1" || s === "paid" || s === "success";
}

export type InitializePaymentBody = {
  orderId: string;
};

export type InitializePaymentResponse = {
  authorizationUrl: string;
  reference: string;
};

export type PaymentOrderStatus = {
  orderId: string;
  paymentStatus?: string;
  paymentReference?: string;
  isPaid: boolean;
  amountPaid?: number;
};

export type PaymentCallbackVerification = PaymentOrderStatus & {
  gatewayStatus?: string;
  message?: string;
};

export type PaymentBank = {
  id: number;
  name: string;
  code: string;
  slug?: string;
  country?: string;
  currency?: string;
  active?: boolean;
};

export type ResolvedBankAccount = {
  accountNumber: string;
  accountName: string;
  bankId?: number;
};

function normalizePaymentOrderStatus(raw: unknown): PaymentOrderStatus {
  const u = unwrap<unknown>(raw);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  return {
    orderId: str(root.orderId ?? root.order_id ?? root.id),
    paymentStatus:
      str(
        root.paymentStatus ??
          root.payment_status ??
          root.orderPaymentStatus ??
          root.order_payment_status,
      ) || undefined,
    paymentReference:
      str(root.paymentReference ?? root.payment_reference ?? root.reference ?? root.trxref) || undefined,
    isPaid: bool(
      root.isPaid ??
        root.is_paid ??
        root.paid ??
        root.status ??
        root.orderPaymentStatus ??
        root.order_payment_status,
    ),
    amountPaid:
      root.amountPaid != null && str(root.amountPaid) !== "" ? Number(root.amountPaid) : undefined,
  };
}

export async function initializePayment(
  body: InitializePaymentBody,
): Promise<InitializePaymentResponse> {
  const { data } = await http.post<unknown>("/payments/initialize", body, { skipStoreContext: true });
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  return {
    authorizationUrl: str(root.authorization_url ?? root.authorizationUrl),
    reference: str(root.reference),
  };
}

export async function verifyPaymentCallback(
  reference: string,
  signal?: AbortSignal,
): Promise<PaymentCallbackVerification> {
  const { data } = await http.get<unknown>("/payments/callback", {
    skipStoreContext: true,
    params: { reference, trxref: reference },
    signal,
  });
  const status = normalizePaymentOrderStatus(data);
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  return {
    ...status,
    gatewayStatus: str(root.gatewayStatus ?? root.gateway_status ?? root.status) || undefined,
    message: str(root.message) || undefined,
  };
}

export async function getPaymentStatusByOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<PaymentOrderStatus> {
  const { data } = await http.get<unknown>(`/payments/orders/${encodeURIComponent(orderId)}/status`, {
    skipStoreContext: true,
    signal,
  });
  return normalizePaymentOrderStatus(data);
}

export async function listPaymentBanks(signal?: AbortSignal): Promise<PaymentBank[]> {
  const { data } = await http.get<unknown>("/payments/banks", {
    skipStoreContext: true,
    signal,
  });
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  const banksRaw = Array.isArray(root.banks)
    ? root.banks
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(u)
        ? u
        : [];
  return banksRaw
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const code = str(row.code);
      const name = str(row.name);
      if (!code || !name) return null;
      return {
        id: Number(row.id ?? 0),
        name,
        code,
        slug: str(row.slug) || undefined,
        country: str(row.country) || undefined,
        currency: str(row.currency) || undefined,
        active: typeof row.active === "boolean" ? row.active : undefined,
      } satisfies PaymentBank;
    })
    .filter((x): x is PaymentBank => x !== null);
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  signal?: AbortSignal,
): Promise<ResolvedBankAccount> {
  const { data } = await http.get<unknown>("/payments/banks/resolve", {
    skipStoreContext: true,
    signal,
    params: {
      account_number: accountNumber,
      bank_code: bankCode,
    },
  });
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  const payload =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  return {
    accountNumber: str(payload.accountNumber ?? payload.account_number ?? accountNumber),
    accountName: str(payload.accountName ?? payload.account_name),
    bankId: payload.bankId != null ? Number(payload.bankId) : undefined,
  };
}
