"use client";

import Link from "next/link";

export default function RiderDashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#00A082]/12 via-surface to-surface p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00A082]">Rider</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Delivery dashboard</h1>
        <p className="mt-2 max-w-xl text-muted">
          Go online to accept deliveries. Earnings and routes will appear here when connected to the live
          dispatch service.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/orders/history"
          className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-[#00A082]/40"
        >
          <p className="text-sm font-semibold text-foreground">Orders</p>
          <p className="mt-1 text-sm text-muted">View delivery history</p>
        </Link>
        <Link
          href="/profile"
          className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-[#00A082]/40"
        >
          <p className="text-sm font-semibold text-foreground">Profile</p>
          <p className="mt-1 text-sm text-muted">Account &amp; payout details</p>
        </Link>
      </div>
    </div>
  );
}
