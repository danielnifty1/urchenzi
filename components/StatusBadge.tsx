"use client";

import clsx from "clsx";

type Props = {
  value: string | undefined;
  kind?: "payment" | "order";
};

export function StatusBadge({ value, kind = "order" }: Props) {
  const normalized = String(value ?? "unknown").toLowerCase().replace(/-/g, "_");
  const label = normalized.replace(/_/g, " ");
  const tone =
    kind === "payment"
      ? normalized === "paid" || normalized === "success"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : normalized === "pending"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : normalized === "delivered"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : normalized === "pending" || normalized === "accepted" || normalized === "ready"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : normalized === "cancelled" || normalized === "delivery_failed"
            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            : "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300";

  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tone)}>
      {label}
    </span>
  );
}
