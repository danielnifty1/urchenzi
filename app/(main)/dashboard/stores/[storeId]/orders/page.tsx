"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { listVendorOrdersScoped, patchVendorOrderStatus } from "@/services/vendorMultiStoreApi";
import type { VendorOrderStatus } from "@/types/vendorMultiStore";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

const STATUSES: VendorOrderStatus[] = ["pending", "preparing", "delivered", "cancelled"];

function badgeClass(s: VendorOrderStatus) {
  switch (s) {
    case "delivered":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "preparing":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "cancelled":
      return "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400";
    default:
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }
}

export default function StoreOrdersPage() {
  const queryClient = useQueryClient();
  const { storeId } = useStoreDashboard();

  const ordersQ = useQuery({
    queryKey: dashboardStoreKeys.orders(storeId),
    queryFn: () => listVendorOrdersScoped(storeId, { limit: 80 }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorOrderStatus }) =>
      patchVendorOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.orders(storeId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Orders</h2>
        <p className="mt-1 text-sm text-muted">Store-scoped list. Status updates call the vendor orders API.</p>
      </div>

      {ordersQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/30" />
          ))}
        </div>
      ) : ordersQ.error ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-rose-600 dark:text-rose-400">
          {getApiErrorMessage(ordersQ.error)}
          <p className="mt-2 text-xs text-muted">
            Implement <code className="font-mono">GET /vendor/orders</code> with{" "}
            <code className="font-mono">x-store-id</code> for live data.
          </p>
        </div>
      ) : !ordersQ.data?.length ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No orders for this store yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/80">
                  <th className="px-4 py-3 font-semibold text-foreground">Customer</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Total</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Placed</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersQ.data.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{o.customerLabel}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(o.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={clsx(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                            badgeClass(o.status),
                          )}
                        >
                          {o.status}
                        </span>
                        <select
                          value={o.status}
                          disabled={updateMut.isPending}
                          onChange={(e) => {
                            const next = e.target.value as VendorOrderStatus;
                            if (next !== o.status) updateMut.mutate({ id: o.id, status: next });
                          }}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
