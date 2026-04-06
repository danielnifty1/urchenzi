"use client";

import Link from "next/link";

export default function VendorOnboardingPendingPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <div className="text-5xl" aria-hidden>
        ⏳
      </div>
      <h1 className="text-2xl font-bold text-foreground">Application under review</h1>
      <p className="text-sm text-muted">
        We received your vendor onboarding details. Our team will review your documents and
        profile. You will be notified when your store is approved.
      </p>
      <p className="text-sm text-muted">
        The seller dashboard unlocks after approval. You can still browse the marketplace as a
        customer.
      </p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
        >
          Back home
        </Link>
        <Link
          href="/profile"
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
