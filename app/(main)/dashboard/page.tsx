"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { DashboardBarChart } from "@/components/dashboard/charts/DashboardBarChart";
import { DashboardLineChart } from "@/components/dashboard/charts/DashboardLineChart";
import { ChartSkeleton, StatsCardsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useVendorDashboardSelection } from "@/contexts/VendorDashboardSelectionContext";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { fetchVendorGlobalDashboard } from "@/services/vendorMultiStoreApi";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

export default function VendorGlobalDashboardPage() {
  const { overviewFilterStoreId, setOverviewFilterStoreId } = useVendorDashboardSelection();

  const storesQ = useQuery({
    queryKey: ["dashboard-accessible-stores"],
    queryFn: () => fetchMyAccessibleStores(),
  });

  const globalQ = useQuery({
    queryKey: ["vendor-global-dashboard", overviewFilterStoreId ?? "all"],
    queryFn: () => fetchVendorGlobalDashboard(overviewFilterStoreId),
    enabled: storesQ.isSuccess,
  });

  const stores = storesQ.data ?? [];

  const filteredRecent = useMemo(() => {
    const list = globalQ.data?.recentOrders ?? [];
    if (!overviewFilterStoreId) return list;
    return list.filter((o) => o.storeId === overviewFilterStoreId || !o.storeId);
  }, [globalQ.data?.recentOrders, overviewFilterStoreId]);

  if (storesQ.isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1419] px-3 sm:px-4 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 py-6 sm:py-8">
          <StatsCardsSkeleton />
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (storesQ.error) {
    return (
      <div className="min-h-screen bg-[#0f1419] px-3 sm:px-4 md:px-8">
        <div className="mx-auto max-w-lg py-8 sm:py-12">
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-3 sm:p-4 text-xs sm:text-sm text-red-200">
            {formatAdminError(storesQ.error)}
          </div>
        </div>
      </div>
    );
  }

  const g = globalQ.data;

  return (
    <div className="min-h-screen bg-[#0f1419] px-3 sm:px-4 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-10 py-4 sm:py-6 md:py-10">
      <header className="flex flex-col gap-4 sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Performance across {stores.length === 1 ? "your store" : "all your stores"}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span className="uppercase tracking-wide">Store filter</span>
            <select
              value={overviewFilterStoreId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setOverviewFilterStoreId(v === "" ? null : v);
                toast.success(v ? "Filtered to one store" : "Showing all stores");
              }}
              className="w-full sm:min-w-[200px] rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white"
            >
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/dashboard/stores"
            className="rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Manage stores
          </Link>
        </div>
      </header>

      {globalQ.isLoading ? (
        <StatsCardsSkeleton />
      ) : globalQ.error ? (
        <p className="text-sm text-rose-400">{formatAdminError(globalQ.error)}</p>
      ) : g ? (
        <>
          {g.partialData ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-100/90">
              Some metrics use client-side estimates until{" "}
              <code className="font-mono text-amber-200/90">GET /vendor/dashboard/global</code> is available.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard label="Total stores" value={g.totalStores} accent="emerald" />
            <StatsCard label="Total products" value={g.totalProducts} accent="violet" />
            <StatsCard label="Total orders" value={g.totalOrders} accent="amber" />
            <StatsCard
              label="Total revenue"
              value={formatCurrency(g.totalRevenue)}
              accent="emerald"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-white">Monthly sales growth</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Revenue or volume trend</p>
              <div className="mt-4">
                <DashboardLineChart data={g.monthlySales} />
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-white">Orders trend</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Month over month</p>
              <div className="mt-4">
                <DashboardBarChart data={g.ordersTrend} />
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Recent activity</h2>
              {overviewFilterStoreId ? (
                <Link
                  href={`/dashboard/stores/${overviewFilterStoreId}/orders`}
                  className="text-xs font-medium text-emerald-400 hover:underline"
                >
                  Open orders →
                </Link>
              ) : (
                <span className="text-xs text-zinc-500">Latest orders</span>
              )}
            </div>
            <ul className="mt-4 divide-y divide-zinc-800/80">
              {filteredRecent.length === 0 ? (
                <li className="py-8 text-center text-sm text-zinc-500">No recent orders yet.</li>
              ) : (
                filteredRecent.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <span className="font-medium text-zinc-200">{o.customerLabel}</span>
                      <span className="ml-2 text-zinc-500">{formatCurrency(o.total)}</span>
                      {o.storeName ? (
                        <span className="mt-0.5 block text-xs text-zinc-600">{o.storeName}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          o.status === "delivered" && "bg-emerald-500/20 text-emerald-300",
                          o.status === "preparing" && "bg-violet-500/20 text-violet-300",
                          o.status === "pending" && "bg-amber-500/20 text-amber-200",
                          o.status === "cancelled" && "bg-zinc-700 text-zinc-300",
                        )}
                      >
                        {o.status}
                      </span>
                      {o.storeId ? (
                        <Link
                          href={`/dashboard/stores/${o.storeId}/orders`}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          View
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      ) : null}

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-300">No stores linked to this account yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Complete onboarding or set <code className="font-mono text-zinc-400">NEXT_PUBLIC_DEV_STORE_ID</code>.
          </p>
          <Link
            href="/onboarding/vendor"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Vendor onboarding
          </Link>
        </div>
      ) : null}
      </div>
    </div>
  );
}
