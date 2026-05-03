"use client";

import { PaginationControls } from "@/components/PaginationControls";
import type { FinanceTransaction, FinancePageMeta } from "@/services/financeApi";
import { formatCurrency } from "@/utils/format";

type Props = {
  rows: FinanceTransaction[];
  meta: FinancePageMeta;
  onPageChange: (page: number) => void;
  busy?: boolean;
};

export function TransactionsTable({ rows, meta, onPageChange, busy }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/70">
              <th className="px-4 py-3 font-semibold text-foreground">ID</th>
              <th className="px-4 py-3 font-semibold text-foreground">Type</th>
              <th className="px-4 py-3 font-semibold text-foreground">Amount</th>
              <th className="px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-foreground">Description</th>
              <th className="px-4 py-3 font-semibold text-foreground">Store</th>
              <th className="px-4 py-3 font-semibold text-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No transactions found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{r.id}</td>
                  <td className="px-4 py-3 uppercase text-foreground">{r.type}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 capitalize text-foreground">{r.status}</td>
                  <td className="px-4 py-3 text-foreground">{r.description ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{r.storeName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
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
