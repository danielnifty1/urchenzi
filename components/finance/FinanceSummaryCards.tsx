"use client";

import type { FinanceSummary } from "@/services/financeApi";
import { formatCurrency } from "@/utils/format";

export function FinanceSummaryCards({ summary }: { summary: FinanceSummary }) {
  const cards = [
    { label: "Total Balance", value: formatCurrency(summary.totalBalance) },
    { label: "Total Credits", value: formatCurrency(summary.totalCredits) },
    { label: "Total Debits", value: formatCurrency(summary.totalDebits) },
    { label: "Pending Withdrawals", value: formatCurrency(summary.pendingWithdrawals) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-muted">{c.label}</p>
          <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
