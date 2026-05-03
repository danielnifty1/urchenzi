"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaginationControls } from "@/components/PaginationControls";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { listCustomerOrdersPaginated } from "@/services/customerOrdersApi";
import { formatCurrency } from "@/utils/format";

export default function OrderHistoryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const ordersQ = useQuery({
    queryKey: ["customer-orders-list", page],
    queryFn: () => listCustomerOrdersPaginated({ page, limit: pageSize }),
  });

  const orders = ordersQ.data?.items ?? [];

  if (ordersQ.isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-24 animate-pulse rounded-3xl bg-brand/30" />
        <div className="h-64 animate-pulse rounded-2xl bg-background" />
      </div>
    );
  }

  if (ordersQ.isError) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        {getApiErrorMessage(ordersQ.error)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-brand p-8 text-white">
        <h1 className="mb-2 text-4xl font-bold">Order history</h1>
        <p className="text-white/80">Your recent orders from this account</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-muted">No orders yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{o.displayRef}</p>
                    {o.storeName ? <p className="text-sm text-muted">{o.storeName}</p> : null}
                    {o.createdAt ? (
                      <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-background px-2 py-1 text-xs font-medium capitalize text-muted">
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold text-foreground">{formatCurrency(o.total)}</span>
                    <Link
                      href={`/order/${encodeURIComponent(o.displayRef)}`}
                      className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      Track
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <PaginationControls
              page={ordersQ.data?.meta.page ?? 1}
              totalPages={ordersQ.data?.meta.totalPages ?? 1}
              totalItems={ordersQ.data?.meta.total}
              onPageChange={setPage}
              busy={ordersQ.isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}
