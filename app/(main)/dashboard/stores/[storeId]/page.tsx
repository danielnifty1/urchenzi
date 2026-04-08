"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StatsCardsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { getVendorDashboardScoped } from "@/services/vendorDashboardApi";
import { listVendorOrdersScoped } from "@/services/vendorMultiStoreApi";
import { formatCurrency } from "@/utils/format";

export default function StoreWorkspaceOverviewPage() {
  const { storeId } = useStoreDashboard();

  const dashQ = useQuery({
    queryKey: [...dashboardStoreKeys.store(storeId), "overview"],
    queryFn: () => getVendorDashboardScoped(storeId),
  });

  const ordersQ = useQuery({
    queryKey: dashboardStoreKeys.orders(storeId),
    queryFn: () => listVendorOrdersScoped(storeId, { limit: 5 }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Store overview</h2>
        <p className="mt-1 text-sm text-muted">
          Quick snapshot for this location. Use the tabs above for full tools.
        </p>
      </div>

      {dashQ.isLoading ? (
        <StatsCardsSkeleton />
      ) : dashQ.error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(dashQ.error)}</p>
      ) : dashQ.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard variant="light" label="Products" value={dashQ.data.metrics.productCount} accent="emerald" />
          <StatsCard variant="light" label="In stock" value={dashQ.data.metrics.inStockCount} accent="violet" />
          <StatsCard
            variant="light"
            label="Features on"
            value={dashQ.data.metrics.featuresEnabledCount}
            accent="amber"
          />
          <StatsCard
            variant="light"
            label="Store"
            value={dashQ.data.settings.isOpen ? "Open" : "Closed"}
            hint={dashQ.data.settings.storeName}
            accent="emerald"
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/dashboard/stores/${storeId}/products`}
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-[#00A082]/40"
        >
          <div className="text-2xl">🍽️</div>
          <h3 className="mt-2 font-semibold text-foreground">Products</h3>
          <p className="mt-1 text-sm text-muted">Manage catalog and inventory.</p>
        </Link>
        <Link
          href={`/dashboard/stores/${storeId}/orders`}
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-[#00A082]/40"
        >
          <div className="text-2xl">📦</div>
          <h3 className="mt-2 font-semibold text-foreground">Orders</h3>
          <p className="mt-1 text-sm text-muted">Track and update order status.</p>
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Latest orders</h3>
        {ordersQ.isLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-background" />
        ) : ordersQ.data?.length ? (
          <ul className="mt-3 divide-y divide-border">
            {ordersQ.data.map((o) => (
              <li key={o.id} className="flex justify-between py-2 text-sm">
                <span className="text-foreground">{o.customerLabel}</span>
                <span className="text-muted">{formatCurrency(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No orders yet for this store.</p>
        )}
      </section>
    </div>
  );
}
