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

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export type WalletSummary = {
  id: string;
  userId: string;
  createdAt?: string;
};

export type WalletBalance = {
  balance: number;
  totalCredits: number;
  totalDebits: number;
};

export type WalletTransaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  reference?: string;
  description?: string;
  createdAt?: string;
};

export type WalletTransactionsPage = {
  items: WalletTransaction[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type CreateWalletWithdrawalPayload = {
  amount: number;
  storeId?: string;
};

function storeScopedReadConfig(storeId?: string, signal?: AbortSignal) {
  const headers = storeId ? { "x-store-id": storeId } : undefined;
  const params = storeId ? { storeId } : undefined;
  return { skipStoreContext: true, signal, headers, params };
}

export async function getWalletSummary(signal?: AbortSignal, storeId?: string): Promise<WalletSummary> {
  const { data } = await http.get<unknown>("/wallet", storeScopedReadConfig(storeId, signal));
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  return {
    id: str(root.id),
    userId: str(root.userId ?? root.user_id),
    createdAt: str(root.createdAt ?? root.created_at) || undefined,
  };
}

export async function getWalletBalance(signal?: AbortSignal, storeId?: string): Promise<WalletBalance> {
  const { data } = await http.get<unknown>("/wallet/balance", storeScopedReadConfig(storeId, signal));
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  return {
    balance: num(root.balance, 0),
    totalCredits: num(root.totalCredits ?? root.total_credits, 0),
    totalDebits: num(root.totalDebits ?? root.total_debits, 0),
  };
}

function normalizeWalletTx(raw: unknown): WalletTransaction | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;
  return {
    id,
    type: str(r.type ?? r.transactionType ?? r.transaction_type) || "unknown",
    status: str(r.status) || "unknown",
    amount: num(r.amount, 0),
    reference: str(r.reference ?? r.paymentReference ?? r.payment_reference) || undefined,
    description: str(r.description ?? r.narration ?? r.note) || undefined,
    createdAt: str(r.createdAt ?? r.created_at) || undefined,
  };
}

export async function getWalletTransactions(
  q: { page?: number; limit?: number; storeId?: string } = {},
  signal?: AbortSignal,
): Promise<WalletTransactionsPage> {
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const limit = Math.min(20, Math.max(1, Math.floor(q.limit ?? 20)));
  const headers = q.storeId ? { "x-store-id": q.storeId } : undefined;
  const { data } = await http.get<unknown>("/wallet/transactions", {
    skipStoreContext: true,
    params: { page, limit, ...(q.storeId ? { storeId: q.storeId } : {}) },
    headers,
    signal,
  });
  const u = unwrap<unknown>(data);
  const root = u && typeof u === "object" && !Array.isArray(u) ? (u as Record<string, unknown>) : {};
  const rowsRaw = Array.isArray(root.items)
    ? root.items
    : Array.isArray(root.transactions)
      ? root.transactions
      : Array.isArray(root.data)
        ? root.data
        : [];
  const items = rowsRaw.map(normalizeWalletTx).filter((x): x is WalletTransaction => x != null);
  const metaRaw =
    root.meta && typeof root.meta === "object" && !Array.isArray(root.meta)
      ? (root.meta as Record<string, unknown>)
      : root;
  const total = num(metaRaw.total, items.length);
  const totalPages = Math.max(1, num(metaRaw.totalPages ?? metaRaw.total_pages, Math.ceil(total / limit)));
  return {
    items,
    meta: {
      page: Math.max(1, num(metaRaw.page, page)),
      limit: Math.max(1, num(metaRaw.limit, limit)),
      total,
      totalPages,
    },
  };
}

export async function createWalletWithdrawal(
  payload: CreateWalletWithdrawalPayload,
): Promise<WalletTransaction> {
  const body: Record<string, unknown> = {
    amount: Math.max(0, Math.floor(payload.amount)),
  };
  if (payload.storeId) body.storeId = payload.storeId;
  const { data } = await http.post<unknown>("/wallet/withdrawals", body, {
    skipStoreContext: true,
    headers: payload.storeId ? { "x-store-id": payload.storeId } : undefined,
  });
  const tx = normalizeWalletTx(unwrap<unknown>(data));
  if (!tx) throw new Error("Invalid withdrawal response");
  return tx;
}
