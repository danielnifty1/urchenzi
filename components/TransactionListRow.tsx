"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { WalletTransaction } from "@/services/walletApi";
import { formatCurrency } from "@/utils/format";

export function TransactionListRow({ tx }: { tx: WalletTransaction }) {
  const sign = tx.type.toLowerCase().includes("debit") ? "-" : "+";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-semibold text-foreground">{tx.reference ?? tx.id}</p>
        <p className="text-xs text-muted">
          {tx.description ?? tx.type}
          {tx.createdAt ? ` • ${new Date(tx.createdAt).toLocaleString()}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge value={tx.status} kind="payment" />
        <span className="font-semibold text-foreground">
          {sign}
          {formatCurrency(Math.abs(tx.amount))}
        </span>
      </div>
    </li>
  );
}
