"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { vendorDashboardKeys } from "@/lib/vendorDashboard/queryKeys";
import { getVendorDashboard } from "@/services/vendorDashboardApi";
import { formatCurrency } from "@/utils/format";

export default function VendorDashboardOverviewPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: vendorDashboardKeys.overview(),
    queryFn: getVendorDashboard,
  });

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
        <p className="mt-2 text-sm opacity-90">{getApiErrorMessage(error)}</p>
        <p className="mt-4 text-sm">
          If you recently became a vendor, your profile may still need approval, or the API may be
          unreachable. Check{" "}
          <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_API_URL</code> and try again.
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
      href: "/vendor/dashboard/products",
      accent: "from-emerald-500/20 to-[#00A082]/10",
    },
    {
      label: "Features enabled",
      value: `${metrics.featuresEnabledCount}/6`,
      hint: "Ordering, promos & more",
      href: "/vendor/dashboard/features",
      accent: "from-amber-500/15 to-orange-500/10",
    },
    {
      label: "Store status",
      value: settings.isOpen ? "Open" : "Closed",
      hint: settings.isOpen ? "Accepting orders" : "Hidden from rush",
      href: "/vendor/dashboard/settings",
      accent: settings.isOpen
        ? "from-sky-500/15 to-blue-500/10"
        : "from-slate-500/20 to-zinc-500/10",
    },
    {
      label: "Minimum order",
      value: formatCurrency(settings.minOrder),
      hint: `Delivery from ${formatCurrency(settings.deliveryFee)}`,
      href: "/vendor/dashboard/settings",
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
            href="/vendor/dashboard/products"
            className="inline-flex items-center justify-center rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/25 transition hover:bg-[#008f72]"
          >
            Manage menu
          </Link>
          <Link
            href="/vendor/dashboard/features"
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
