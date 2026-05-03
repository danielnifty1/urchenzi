"use client";

import { PaginationControls } from "@/components/PaginationControls";
import type { FinancePageMeta, FinancePayout } from "@/services/financeApi";
import { formatCurrency } from "@/utils/format";

type Props = {
  rows: FinancePayout[];
  meta: FinancePageMeta;
  onPageChange: (page: number) => void;
  busy?: boolean;
};

export function PayoutsTable({ rows, meta, onPageChange, busy }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/70">
              <th className="px-4 py-3 font-semibold text-foreground">Recipient</th>
              <th className="px-4 py-3 font-semibold text-foreground">Amount</th>
              <th className="px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-foreground">Reference</th>
              <th className="px-4 py-3 font-semibold text-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No payouts found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-foreground">{r.recipient ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 capitalize text-foreground">{r.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{r.reference ?? "—"}</td>
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
