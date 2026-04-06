"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminOverviewCharts } from "@/components/admin/AdminOverviewCharts";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { fetchAdminOverview } from "@/services/adminDashboardApi";

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent: "emerald" | "sky" | "amber" | "pink" | "violet" | "orange";
}) {
  const ring = {
    emerald: "from-emerald-500/20 to-emerald-500/0 ring-emerald-500/30",
    sky: "from-sky-500/20 to-sky-500/0 ring-sky-500/30",
    amber: "from-amber-500/20 to-amber-500/0 ring-amber-500/30",
    pink: "from-pink-500/20 to-pink-500/0 ring-pink-500/30",
    violet: "from-violet-500/20 to-violet-500/0 ring-violet-500/30",
    orange: "from-orange-500/20 to-orange-500/0 ring-orange-500/30",
  }[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ring} p-5 ring-1 ring-inset`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value.toLocaleString()}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminOverview,
    enabled: !!user && user.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        <p className="font-medium">Could not load overview</p>
        <p className="mt-2 text-sm opacity-90">{formatAdminError(error)}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-lg bg-red-900/40 px-4 py-2 text-sm text-white hover:bg-red-900/60"
        >
          Retry
        </button>
      </div>
    );
  }

  const overview = data!.overview;
  const notFound = data!.notFound;
  const hasAnyUsers =
    overview.customers + overview.vendors + overview.riders + overview.admins > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform overview — metrics from <code className="text-zinc-400">GET /admin/overview</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isRefetching}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          {isRefetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {notFound ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Overview API not found (404)</p>
          <p className="mt-1 text-amber-200/70">
            Add <code className="rounded bg-black/30 px-1">GET /api/v1/admin/overview</code> on your Nest
            backend returning counts (see <code className="text-zinc-400">normalizeAdminOverview</code> in{" "}
            <code className="text-zinc-500">services/adminDashboardApi.ts</code>). Charts will populate
            automatically.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Customers" value={overview.customers} accent="emerald" />
        <MetricCard label="Vendors" value={overview.vendors} accent="sky" />
        <MetricCard label="Riders" value={overview.riders} accent="amber" />
        <MetricCard label="Admins" value={overview.admins} accent="pink" />
        <MetricCard label="Orders" value={overview.orders} accent="violet" hint="All-time" />
        <MetricCard
          label="Pending vendors"
          value={overview.pendingVendors}
          accent="orange"
          hint="Awaiting approval"
        />
      </div>

      <AdminOverviewCharts overview={overview} hasAnyUsers={hasAnyUsers} />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div>
          <p className="text-sm font-medium text-zinc-300">Manage a specific store</p>
          <p className="mt-1 text-xs text-zinc-500">
            Enter a vendor UUID to open settings, products, and media for that vendor.
          </p>
        </div>
        <Link
          href="/admin/vendor"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Open directory
        </Link>
      </div>

      <div className="flex justify-center border-t border-zinc-800/80 pt-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to storefront
        </Link>
      </div>
    </div>
  );
}
