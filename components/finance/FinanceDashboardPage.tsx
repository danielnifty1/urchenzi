"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErrorStateRetry } from "@/components/ErrorStateRetry";
import { FinanceSummaryCards } from "@/components/finance/FinanceSummaryCards";
import { PayoutsTable } from "@/components/finance/PayoutsTable";
import { StoreFilterDropdown } from "@/components/finance/StoreFilterDropdown";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { WithdrawalsTable } from "@/components/finance/WithdrawalsTable";
import { dashboardAccessibleStoresQueryKey } from "@/lib/dashboard/queryKeys";
import {
  getFinancePayouts,
  getFinanceSummary,
  getFinanceTransactions,
  getFinanceWithdrawals,
} from "@/services/financeApi";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { useUserStore } from "@/store/userStore";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { formatCurrency } from "@/utils/format";

function monthKey(iso?: string): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function FinanceDashboardPage({ forcedStoreId }: { forcedStoreId?: string }) {
  const user = useUserStore((s) => s.user);
  const role = user?.role;
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const isStoreManager = role === "store_manager";

  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [txType, setTxType] = useState("");
  const [txStatus, setTxStatus] = useState("");

  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const [poPage, setPoPage] = useState(1);

  const storesQ = useQuery({
    queryKey: dashboardAccessibleStoresQueryKey(user?.role),
    queryFn: fetchMyAccessibleStores,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!storesQ.data?.length) return;
    if ((isStoreManager || isVendor) && !selectedStoreId) {
      setSelectedStoreId(storesQ.data[0]?.id ?? "");
    }
  }, [isStoreManager, isVendor, selectedStoreId, storesQ.data]);

  const scopedStoreId = useMemo(() => {
    if (forcedStoreId) return forcedStoreId;
    if (isStoreManager) return selectedStoreId || storesQ.data?.[0]?.id || "";
    if (isVendor) return selectedStoreId || storesQ.data?.[0]?.id || "";
    if (isAdmin) return selectedStoreId || "";
    return "";
  }, [forcedStoreId, isAdmin, isStoreManager, isVendor, selectedStoreId, storesQ.data]);

  const summaryQ = useQuery({
    queryKey: ["finance-summary", role, scopedStoreId],
    queryFn: () => getFinanceSummary(scopedStoreId || undefined),
    enabled: Boolean(user),
  });

  const txQ = useQuery({
    queryKey: ["finance-transactions", role, scopedStoreId, userFilter, txType, txStatus, txPage],
    queryFn: () =>
      getFinanceTransactions({
        page: txPage,
        limit: 20,
        type: txType || undefined,
        status: txStatus || undefined,
        userId: isAdmin ? userFilter || undefined : undefined,
        storeId: scopedStoreId || undefined,
      }),
    enabled: Boolean(user),
  });

  const wdQ = useQuery({
    queryKey: ["finance-withdrawals", role, scopedStoreId, userFilter, wdPage],
    queryFn: () =>
      getFinanceWithdrawals({
        page: wdPage,
        limit: 20,
        userId: isAdmin ? userFilter || undefined : undefined,
        storeId: scopedStoreId || undefined,
      }),
    enabled: Boolean(user),
  });

  const payoutsVisible = !isStoreManager;
  const poQ = useQuery({
    queryKey: ["finance-payouts", role, scopedStoreId, userFilter, poPage],
    queryFn: () =>
      getFinancePayouts({
        page: poPage,
        limit: 20,
        userId: isAdmin ? userFilter || undefined : undefined,
        storeId: scopedStoreId || undefined,
      }),
    enabled: Boolean(user) && payoutsVisible,
  });

  const chartData = useMemo(() => {
    const map = new Map<string, { month: string; credits: number; debits: number; revenue: number }>();
    for (const tx of txQ.data?.items ?? []) {
      const key = monthKey(tx.createdAt);
      const row = map.get(key) ?? { month: key, credits: 0, debits: 0, revenue: 0 };
      const isCredit = tx.type.toLowerCase() === "credit";
      if (isCredit) {
        row.credits += tx.amount;
        row.revenue += tx.amount;
      } else {
        row.debits += tx.amount;
      }
      map.set(key, row);
    }
    return Array.from(map.values());
  }, [txQ.data?.items]);

  if (!user) {
    return <ErrorStateRetry message="Login required for finance dashboard." />;
  }

  const loading = summaryQ.isLoading || txQ.isLoading || wdQ.isLoading || (payoutsVisible && poQ.isLoading);
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-background" />
        <div className="h-64 animate-pulse rounded-2xl bg-background" />
      </div>
    );
  }

  const firstError = summaryQ.error ?? txQ.error ?? wdQ.error ?? poQ.error;
  if (firstError) {
    return (
      <ErrorStateRetry
        message={getApiErrorMessage(firstError)}
        onRetry={() => {
          void summaryQ.refetch();
          void txQ.refetch();
          void wdQ.refetch();
          void poQ.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-sm text-muted">
            {isAdmin
              ? "System-wide finance visibility."
              : isVendor
                ? "Store-level finance visibility."
                : "Store-level finance visibility."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(isVendor || role === "rider") ? (
            <Link
              href={scopedStoreId ? `/wallet?storeId=${encodeURIComponent(scopedStoreId)}` : "/wallet"}
              className="rounded-lg bg-[#00A082] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72]"
            >
              Request withdrawal
            </Link>
          ) : null}
          {(isAdmin || isVendor) && !forcedStoreId && (
            <StoreFilterDropdown
              value={selectedStoreId}
              stores={(storesQ.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
              includeAll={!isVendor}
              onChange={(v) => {
                setSelectedStoreId(v);
                setTxPage(1);
                setWdPage(1);
                setPoPage(1);
              }}
            />
          )}
          {isAdmin ? (
            <input
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setTxPage(1);
                setWdPage(1);
                setPoPage(1);
              }}
              placeholder="Filter by user"
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            />
          ) : null}
        </div>
      </header>

      <FinanceSummaryCards
        summary={
          summaryQ.data ?? {
            totalBalance: 0,
            totalCredits: 0,
            totalDebits: 0,
            pendingWithdrawals: 0,
          }
        }
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Credits vs Debits</h2>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="pt-10 text-center text-sm text-muted">No chart data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="credits" stroke="#10b981" />
                  <Line type="monotone" dataKey="debits" stroke="#f43f5e" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Monthly Revenue Trend</h2>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="pt-10 text-center text-sm text-muted">No chart data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <div className="flex gap-2">
            <select
              value={txType}
              onChange={(e) => {
                setTxType(e.target.value);
                setTxPage(1);
              }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">All types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
            <select
              value={txStatus}
              onChange={(e) => {
                setTxStatus(e.target.value);
                setTxPage(1);
              }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
        <TransactionsTable
          rows={txQ.data?.items ?? []}
          meta={txQ.data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={setTxPage}
          busy={txQ.isFetching}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Withdrawals</h2>
        <WithdrawalsTable
          rows={wdQ.data?.items ?? []}
          meta={wdQ.data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
          onPageChange={setWdPage}
          busy={wdQ.isFetching}
          isAdmin={isAdmin}
        />
      </section>

      {payoutsVisible ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Payouts</h2>
          <PayoutsTable
            rows={poQ.data?.items ?? []}
            meta={poQ.data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
            onPageChange={setPoPage}
            busy={poQ.isFetching}
          />
        </section>
      ) : null}
    </div>
  );
}
