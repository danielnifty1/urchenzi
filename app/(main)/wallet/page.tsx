"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ErrorStateRetry } from "@/components/ErrorStateRetry";
import { PaginationControls } from "@/components/PaginationControls";
import { TransactionListRow } from "@/components/TransactionListRow";
import { useWalletBalance, useWalletSummary } from "@/hooks/useWalletBalance";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardAccessibleStoresQueryKey } from "@/lib/dashboard/queryKeys";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { createWalletWithdrawal } from "@/services/walletApi";
import { useUserStore } from "@/store/userStore";
import { formatCurrency } from "@/utils/format";

export default function WalletPage() {
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [effectiveStoreId, setEffectiveStoreId] = useState("");
  const [pollPending, setPollPending] = useState(false);
  const isVendor = user?.role === "vendor";
  const isRider = user?.role === "rider";
  const canWithdraw = isVendor || isRider;
  const requestedStoreId = (searchParams.get("storeId") ?? "").trim();
  const storesQ = useQuery({
    queryKey: dashboardAccessibleStoresQueryKey(user?.role),
    queryFn: fetchMyAccessibleStores,
    enabled: isVendor,
  });
  useEffect(() => {
    if (!isVendor) return;
    if (requestedStoreId) {
      setEffectiveStoreId(requestedStoreId);
      setSelectedStoreId(requestedStoreId);
      return;
    }
    const first = storesQ.data?.[0]?.id ?? "";
    if (!first) return;
    setEffectiveStoreId((prev) => prev || first);
    setSelectedStoreId((prev) => prev || first);
  }, [isVendor, requestedStoreId, storesQ.data]);
  const scopedStoreId = isVendor ? selectedStoreId || effectiveStoreId : undefined;
  const summaryQ = useWalletSummary(scopedStoreId);
  const balanceQ = useWalletBalance(scopedStoreId);
  const txQ = useWalletTransactions(page, 20, {
    refetchInterval: pollPending ? 10_000 : false,
    storeId: scopedStoreId,
  });
  const minRemainingBalance = 100;
  const amountNumber = Math.max(0, Math.floor(Number(withdrawAmount || 0)));
  const hasBalanceHeadroom = (balanceQ.data?.balance ?? 0) - amountNumber >= minRemainingBalance;
  const needsStoreSelection = isVendor && !scopedStoreId;
  const canSubmitWithdrawal =
    canWithdraw && amountNumber > 0 && hasBalanceHeadroom && !needsStoreSelection;

  const withdrawalMut = useMutation({
    mutationFn: () =>
      createWalletWithdrawal({ amount: amountNumber, ...(isVendor ? { storeId: scopedStoreId } : {}) }),
    onSuccess: () => {
      setWithdrawAmount("");
      setPollPending(true);
      toast.success("Withdrawal submitted");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] }),
      ]);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const hasPendingTx = useMemo(
    () => (txQ.data?.items ?? []).some((tx) => tx.status.toUpperCase() === "PENDING"),
    [txQ.data?.items],
  );
  useEffect(() => {
    if (!hasPendingTx && pollPending) {
      setPollPending(false);
    }
  }, [hasPendingTx, pollPending]);
  useEffect(() => {
    if (!isVendor) return;
    if (selectedStoreId && storesQ.data?.some((store) => store.id === selectedStoreId)) return;
    if (!effectiveStoreId) return;
    setSelectedStoreId(effectiveStoreId);
  }, [isVendor, selectedStoreId, effectiveStoreId, storesQ.data]);

  if (authResolved && !user) {
    return (
      <ErrorStateRetry
        message="You need to be logged in to view wallet details."
        onRetry={() => window.location.assign("/login")}
      />
    );
  }

  if (summaryQ.isLoading || balanceQ.isLoading || txQ.isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-background" />;
  }

  if (summaryQ.isError || balanceQ.isError || txQ.isError) {
    return (
      <ErrorStateRetry
        message={getApiErrorMessage(summaryQ.error ?? balanceQ.error ?? txQ.error)}
        onRetry={() => {
          void summaryQ.refetch();
          void balanceQ.refetch();
          void txQ.refetch();
        }}
      />
    );
  }

  const txItems = txQ.data?.items ?? [];
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="mt-1 text-sm text-muted">Ledger balance and transaction history.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-muted">Current balance</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(balanceQ.data?.balance ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-muted">Total credited</p>
            <p className="text-xl font-bold text-emerald-500">
              {formatCurrency(balanceQ.data?.totalCredits ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-muted">Total debited</p>
            <p className="text-xl font-bold text-rose-500">
              {formatCurrency(balanceQ.data?.totalDebits ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {canWithdraw ? (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-foreground">Withdraw funds</h2>
          <p className="mt-1 text-sm text-muted">
            Submitted withdrawals are created as pending and settle later.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (needsStoreSelection) {
                toast.error("Select a store before submitting.");
                return;
              }
              if (!hasBalanceHeadroom) {
                toast.error("A minimum balance of 100 must remain after withdrawal.");
                return;
              }
              withdrawalMut.mutate();
            }}
          >
            <label className="space-y-1 text-sm sm:col-span-1">
              <span className="font-medium text-foreground">Amount</span>
              <input
                type="number"
                min={1}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                placeholder="500"
              />
            </label>
            {isVendor ? (
              <label className="space-y-1 text-sm sm:col-span-1">
                <span className="font-medium text-foreground">Store</span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                >
                  <option value="">
                    {storesQ.isLoading ? "Loading stores..." : "Select store"}
                  </option>
                  {(storesQ.data ?? []).map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="sm:col-span-1 sm:self-end">
              <button
                type="submit"
                disabled={!canSubmitWithdrawal || withdrawalMut.isPending}
                className="w-full rounded-xl bg-[#00A082] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] disabled:opacity-50"
              >
                {withdrawalMut.isPending ? "Submitting..." : "Submit withdrawal"}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted">
            Available: {formatCurrency(balanceQ.data?.balance ?? 0)}. Minimum remaining balance:{" "}
            {formatCurrency(minRemainingBalance)}.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-foreground">Transactions</h2>
        {txItems.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No wallet transactions yet.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-border">
              {txItems.map((tx) => (
                <TransactionListRow key={tx.id} tx={tx} />
              ))}
            </ul>
            <PaginationControls
              page={txQ.data?.meta.page ?? 1}
              totalPages={txQ.data?.meta.totalPages ?? 1}
              totalItems={txQ.data?.meta.total}
              onPageChange={setPage}
              busy={txQ.isFetching}
              alwaysShow
            />
          </>
        )}
      </section>

      <div className="flex gap-2">
        <Link href="/orders/history" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">
          Order history
        </Link>
      </div>
    </div>
  );
}
