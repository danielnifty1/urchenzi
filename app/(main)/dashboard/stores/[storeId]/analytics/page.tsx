"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardBarChart } from "@/components/dashboard/charts/DashboardBarChart";
import { DashboardLineChart } from "@/components/dashboard/charts/DashboardLineChart";
import { ChartSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { fetchVendorStoreAnalytics } from "@/services/vendorMultiStoreApi";
import { formatCurrency } from "@/utils/format";

export default function StoreAnalyticsPage() {
  const { storeId } = useStoreDashboard();

  const q = useQuery({
    queryKey: dashboardStoreKeys.analytics(storeId),
    queryFn: () => fetchVendorStoreAnalytics(storeId),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <p className="mt-1 text-sm text-muted">Revenue, volume, and top products for this store.</p>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-800/30" />
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-800/30" />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : q.error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(q.error)}</p>
      ) : q.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard variant="light" label="Revenue (est.)" value={formatCurrency(q.data.revenue)} accent="emerald" />
            <StatsCard variant="light" label="Orders" value={q.data.ordersCount} accent="violet" />
          </div>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Monthly breakdown</h3>
            <div className="mt-4">
              <DashboardLineChart data={q.data.monthlyBreakdown} color="#22d3ee" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Best-selling products</h3>
            <div className="mt-4">
              <DashboardBarChart data={q.data.bestSelling.map((b) => ({ label: b.name.slice(0, 12), value: b.units }))} />
            </div>
            <ul className="mt-4 divide-y divide-border text-sm">
              {q.data.bestSelling.map((b) => (
                <li key={b.productId} className="flex justify-between py-2">
                  <span className="text-foreground">{b.name}</span>
                  <span className="text-muted">
                    {b.units} sold · {formatCurrency(b.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
