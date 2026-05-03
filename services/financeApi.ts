import { apiGet } from "@/lib/api";

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

type FinanceQuery = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  userId?: string;
  storeId?: string;
};

export type FinanceSummary = {
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  pendingWithdrawals: number;
};

export type FinanceTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  storeName?: string;
  userName?: string;
  createdAt?: string;
};

export type FinanceWithdrawal = {
  id: string;
  userName?: string;
  amount: number;
  status: string;
  createdAt?: string;
};

export type FinancePayout = {
  id: string;
  recipient?: string;
  amount: number;
  status: string;
  reference?: string;
  createdAt?: string;
};

export type FinancePageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FinanceTransactionsPage = {
  items: FinanceTransaction[];
  meta: FinancePageMeta;
};

export type FinanceWithdrawalsPage = {
  items: FinanceWithdrawal[];
  meta: FinancePageMeta;
};

export type FinancePayoutsPage = {
  items: FinancePayout[];
  meta: FinancePageMeta;
};

function toQuery(q: FinanceQuery): string {
  const params = new URLSearchParams();
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  if (q.status) params.set("status", q.status);
  if (q.type) params.set("type", q.type);
  if (q.userId) params.set("userId", q.userId);
  if (q.storeId) params.set("storeId", q.storeId);
  const s = params.toString();
  return s ? `?${s}` : "";
}

function normalizeMeta(raw: Record<string, unknown>, fallbackLimit: number): FinancePageMeta {
  const m =
    raw.meta && typeof raw.meta === "object" && !Array.isArray(raw.meta)
      ? (raw.meta as Record<string, unknown>)
      : raw;
  const page = Math.max(1, num(m.page, 1));
  const limit = Math.max(1, num(m.limit, fallbackLimit));
  const total = Math.max(0, num(m.total, 0));
  const totalPages = Math.max(1, num(m.totalPages ?? m.total_pages, Math.ceil(total / limit) || 1));
  return { page, limit, total, totalPages };
}

export async function getFinanceSummary(storeId?: string): Promise<FinanceSummary> {
  const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  const raw = await apiGet<Record<string, unknown>>(`/admin/finance/summary${q}`, {
    skipStoreContext: true,
  });
  return {
    totalBalance: num(raw.totalBalance ?? raw.total_balance ?? raw.balance),
    totalCredits: num(raw.totalCredits ?? raw.total_credits ?? raw.credits),
    totalDebits: num(raw.totalDebits ?? raw.total_debits ?? raw.debits),
    pendingWithdrawals: num(raw.pendingWithdrawals ?? raw.pending_withdrawals),
  };
}

export async function getFinanceTransactions(q: FinanceQuery = {}): Promise<FinanceTransactionsPage> {
  const limit = Math.min(20, Math.max(1, q.limit ?? 20));
  const raw = await apiGet<Record<string, unknown>>(
    `/admin/transactions${toQuery({ ...q, limit })}`,
    { skipStoreContext: true },
  );
  const rowsRaw = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.transactions)
      ? raw.transactions
      : Array.isArray(raw.data)
        ? raw.data
        : [];
  const items: FinanceTransaction[] = rowsRaw
    .map((x): FinanceTransaction | null => {
      if (!x || typeof x !== "object") return null;
      const r = x as Record<string, unknown>;
      return {
        id: str(r.id),
        type: str(r.type || "unknown").toUpperCase(),
        amount: num(r.amount),
        status: str(r.status || "unknown").toLowerCase(),
        description: str(r.description ?? r.narration ?? r.note) || undefined,
        storeName: str(r.storeName ?? r.store_name) || undefined,
        userName: str(r.userName ?? r.user_name ?? r.email) || undefined,
        createdAt: str(r.createdAt ?? r.created_at) || undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { items, meta: normalizeMeta(raw, limit) };
}

export async function getFinanceWithdrawals(q: FinanceQuery = {}): Promise<FinanceWithdrawalsPage> {
  const limit = Math.min(20, Math.max(1, q.limit ?? 20));
  const raw = await apiGet<Record<string, unknown>>(
    `/admin/withdrawals${toQuery({ ...q, limit })}`,
    { skipStoreContext: true },
  );
  const rowsRaw = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.withdrawals)
      ? raw.withdrawals
      : Array.isArray(raw.data)
        ? raw.data
        : [];
  const items: FinanceWithdrawal[] = rowsRaw
    .map((x): FinanceWithdrawal | null => {
      if (!x || typeof x !== "object") return null;
      const r = x as Record<string, unknown>;
      return {
        id: str(r.id),
        userName: str(r.userName ?? r.user_name ?? r.email) || undefined,
        amount: num(r.amount),
        status: str(r.status || "unknown").toLowerCase(),
        createdAt: str(r.createdAt ?? r.created_at) || undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { items, meta: normalizeMeta(raw, limit) };
}

export async function getFinancePayouts(q: FinanceQuery = {}): Promise<FinancePayoutsPage> {
  const limit = Math.min(20, Math.max(1, q.limit ?? 20));
  const raw = await apiGet<Record<string, unknown>>(
    `/admin/payouts${toQuery({ ...q, limit })}`,
    { skipStoreContext: true },
  );
  const rowsRaw = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.payouts)
      ? raw.payouts
      : Array.isArray(raw.data)
        ? raw.data
        : [];
  const items: FinancePayout[] = rowsRaw
    .map((x): FinancePayout | null => {
      if (!x || typeof x !== "object") return null;
      const r = x as Record<string, unknown>;
      return {
        id: str(r.id),
        recipient: str(r.recipient ?? r.userName ?? r.user_name) || undefined,
        amount: num(r.amount),
        status: str(r.status || "unknown").toLowerCase(),
        reference: str(r.reference ?? r.paymentReference ?? r.payment_reference) || undefined,
        createdAt: str(r.createdAt ?? r.created_at) || undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { items, meta: normalizeMeta(raw, limit) };
}
