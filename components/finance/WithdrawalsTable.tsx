"use client";

import toast from "react-hot-toast";
import { PaginationControls } from "@/components/PaginationControls";
import type { FinancePageMeta, FinanceWithdrawal } from "@/services/financeApi";
import { formatCurrency } from "@/utils/format";

type Props = {
  rows: FinanceWithdrawal[];
  meta: FinancePageMeta;
  onPageChange: (page: number) => void;
  busy?: boolean;
  isAdmin?: boolean;
};

export function WithdrawalsTable({ rows, meta, onPageChange, busy, isAdmin }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/70">
              <th className="px-4 py-3 font-semibold text-foreground">User</th>
              <th className="px-4 py-3 font-semibold text-foreground">Amount</th>
              <th className="px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-foreground">Date</th>
              {isAdmin ? <th className="px-4 py-3 font-semibold text-foreground">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-muted">
                  No withdrawals found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-foreground">{r.userName ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 capitalize text-foreground">{r.status}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-500/40 px-2 py-1 text-xs font-semibold text-emerald-400"
                          onClick={() => toast("Approve endpoint not wired yet.")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs font-semibold text-rose-400"
                          onClick={() => toast("Reject endpoint not wired yet.")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={onPageChange}
        busy={busy}
        alwaysShow
      />
    </div>
  );
}
