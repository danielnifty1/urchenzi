"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardBarChart } from "@/components/dashboard/charts/DashboardBarChart";
import { DashboardLineChart } from "@/components/dashboard/charts/DashboardLineChart";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { fetchVendorGlobalDashboard } from "@/services/vendorMultiStoreApi";
import { getVendorDashboard } from "@/services/vendorDashboardApi";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

export default function VendorDashboardOverviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeIdFromQuery = (searchParams.get("storeId") ?? "").trim();
  const storeId = storeIdFromQuery || null;

  const storesQ = useQuery({
    queryKey: ["vendor-dashboard", "stores", "overview"],
    queryFn: fetchMyAccessibleStores,
  });

  const stores = storesQ.data ?? [];
  const activeStores = useMemo(
    () => stores.filter((s) => s.status === "active" || s.status === "pending"),
    [stores],
  );

  const isMultiStoreOverview =
    storesQ.isSuccess && !storeId && activeStores.length > 1;

  const isWaitingSingleAutoSelect =
    storesQ.isSuccess && !storeId && activeStores.length === 1;

  const globalQ = useQuery({
    queryKey: ["vendor-dashboard-global-overview"],
    queryFn: () => fetchVendorGlobalDashboard(null),
    enabled: isMultiStoreOverview,
  });

  const singleDashQ = useQuery({
    queryKey: ["vendor-dashboard", "overview", storeId ?? "none"],
    queryFn: () => getVendorDashboard(storeId!),
    enabled: storesQ.isSuccess && Boolean(storeId) && !isMultiStoreOverview,
  });

  useEffect(() => {
    if (storeId) return;
    if (!storesQ.isSuccess) return;
    if (activeStores.length !== 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("storeId", activeStores[0].id);
    router.replace(`/vendor/dashboard?${params.toString()}`);
  }, [activeStores, router, searchParams, storeId, storesQ.isSuccess]);

  if (storesQ.isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-background" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-background" />
          ))}
        </div>
      </div>
    );
  }

  if (storesQ.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <p className="font-semibold">Could not load stores</p>
        <p className="mt-2 text-sm opacity-90">{getApiErrorMessage(storesQ.error)}</p>
      </div>
    );
  }

  if (activeStores.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-sm">
        <p className="font-semibold text-foreground">No stores yet</p>
        <p className="mt-2 text-sm text-muted">Create a store from your onboarding flow or contact support.</p>
        <Link
          href="/dashboard/stores"
          className="mt-6 inline-flex rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/25"
        >
          Manage stores
        </Link>
      </div>
    );
  }

  if (isWaitingSingleAutoSelect) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-background" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-background" />
          ))}
        </div>
      </div>
    );
  }

  if (isMultiStoreOverview) {
    if (globalQ.isLoading) {
      return (
        <div className="space-y-8 animate-pulse">
          <div className="h-36 rounded-2xl bg-background" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-background" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-2xl bg-background" />
            <div className="h-64 rounded-2xl bg-background" />
          </div>
        </div>
      );
    }

    if (globalQ.isError || !globalQ.data) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          <p className="font-semibold">Could not load combined metrics</p>
          <p className="mt-2 text-sm opacity-90">{getApiErrorMessage(globalQ.error)}</p>
          <p className="mt-4 text-sm text-muted">
            Pick a store from the header dropdown to open a single-store overview instead.
          </p>
        </div>
      );
    }

    const g = globalQ.data;

    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-[#00A082]/12 via-surface to-surface p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[#00A082]">Overview</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">All your stores</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Performance across {activeStores.length} locations. Use <strong className="text-foreground">Choose store</strong>{" "}
            in the header to work on menu, features, or settings for one store.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeStores.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("storeId", s.id);
                  router.replace(`/vendor/dashboard?${params.toString()}`);
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-[#00A082]/50 hover:bg-background/80"
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f1419] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-zinc-800"
            >
              Multi-store dashboard
            </Link>
            <Link
              href="/dashboard/stores"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background/80"
            >
              Manage stores
            </Link>
          </div>
        </div>

      

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Total stores" value={g.totalStores} accent="emerald" variant="light" />
          <StatsCard label="Total products" value={g.totalProducts} accent="violet" variant="light" />
          <StatsCard label="Total orders" value={g.totalOrders} accent="amber" variant="light" />
          <StatsCard
            label="Total revenue"
            value={formatCurrency(g.totalRevenue)}
            accent="emerald"
            variant="light"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Monthly sales growth</h3>
            <p className="mt-0.5 text-xs text-muted">Revenue or volume trend</p>
            <div className="mt-4">
              <DashboardLineChart data={g.monthlySales} />
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Orders trend</h3>
            <p className="mt-0.5 text-xs text-muted">Month over month</p>
            <div className="mt-4">
              <DashboardBarChart data={g.ordersTrend} />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          <ul className="mt-4 divide-y divide-border">
            {g.recentOrders.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">No recent orders yet.</li>
            ) : (
              g.recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{o.customerLabel}</span>
                    <span className="ml-2 text-muted">{formatCurrency(o.total)}</span>
                    {o.storeName ? (
                      <span className="mt-0.5 block text-xs text-muted">{o.storeName}</span>
                    ) : null}
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      o.status === "delivered" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                      o.status === "in_transit" && "bg-cyan-500/15 text-cyan-900 dark:text-cyan-200",
                      o.status === "pending" && "bg-amber-500/15 text-amber-900 dark:text-amber-200",
                      o.status === "delivery_failed" && "bg-rose-500/15 text-rose-900 dark:text-rose-200",
                      o.status === "cancelled" && "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {o.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    );
  }

  const { data, isLoading, isError, error } = singleDashQ;
  const message = getApiErrorMessage(error);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-background" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-background" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <p className="font-semibold">Could not load vendor dashboard</p>
        <p className="mt-2 text-sm opacity-90">{message}</p>
        <p className="mt-4 text-sm">
          If you recently became a vendor, your profile may still need approval — contact support if this persists.
        </p>
      </div>
    );
  }

  const { settings, metrics } = data;
  const inStock = metrics.inStockCount;

  const cards = [
    {
      label: "Products listed",
      value: String(metrics.productCount),
      hint: `${inStock} available now`,
      href: `/vendor/dashboard/products${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`,
      accent: "from-emerald-500/20 to-[#00A082]/10",
    },
    {
      label: "Features enabled",
      value: `${metrics.featuresEnabledCount}/6`,
      hint: "Ordering, promos & more",
      href: `/vendor/dashboard/features${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`,
      accent: "from-amber-500/15 to-orange-500/10",
    },
    {
      label: "Store status",
      value: settings.isOpen ? "Open" : "Closed",
      hint: settings.isOpen ? "Accepting orders" : "Hidden from rush",
      href: `/vendor/dashboard/settings${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`,
      accent: settings.isOpen
        ? "from-sky-500/15 to-blue-500/10"
        : "from-slate-500/20 to-zinc-500/10",
    },
    {
      label: "Minimum order",
      value: formatCurrency(settings.minOrder),
      hint: `Delivery from ${formatCurrency(settings.deliveryFee)}`,
      href: `/vendor/dashboard/settings${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`,
      accent: "from-violet-500/15 to-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#00A082]/12 via-surface to-surface p-6 shadow-sm md:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[#00A082]">
          Welcome back
        </p>
        <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          {settings.storeName}
        </h2>
        <p className="mt-2 max-w-xl text-muted">{settings.tagline}</p>
        {settings.storeSlug ? (
          <p className="mt-2 text-sm text-muted">
            Store URL:{" "}
            <Link href={`/store/${settings.storeSlug}`} className="font-medium text-[#00A082] hover:underline">
              /store/{settings.storeSlug}
            </Link>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[#0f1419] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800"
          >
            Multi-store dashboard
          </Link>
          <Link
            href={`/vendor/dashboard/products${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/25 transition hover:bg-[#008f72]"
          >
            Manage menu
          </Link>
          <Link
            href={`/vendor/dashboard/features${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background/80"
          >
            Feature switches
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-[#00A082]/40 hover:shadow-md"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${c.accent}`}
            />
            <div className="relative">
              <p className="text-sm font-medium text-muted">{c.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {c.value}
              </p>
              <p className="mt-1 text-xs text-muted">{c.hint}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-[#00A082] opacity-0 transition group-hover:opacity-100">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Quick tips</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="text-[#00A082]">✓</span>
              Turn off items you cannot fulfil today instead of deleting them.
            </li>
            <li className="flex gap-2">
              <span className="text-[#00A082]">✓</span>
              Scheduled orders help lunch rush — enable them under Features.
            </li>
            <li className="flex gap-2">
              <span className="text-[#00A082]">✓</span>
              Match prep times to your kitchen so estimates stay accurate.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6">
          <h3 className="text-lg font-semibold text-foreground">Backend data</h3>
          <p className="mt-2 text-sm text-muted">
            This dashboard loads from your Nest API (
            <code className="rounded bg-background px-1">/api/v1/vendor/…</code>
            ). Product images can be uploaded under Menu &amp; products.
          </p>
        </div>
      </div>
    </div>
  );
}
