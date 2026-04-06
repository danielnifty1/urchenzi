"use client";

import { useParams } from "next/navigation";

export default function AdminVendorMediaPage() {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Media</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Admin vendor routes no longer accept media uploads. File uploads belong to the vendor dashboard (
          <span className="font-mono text-zinc-400">VendorDashboardController</span> with an active store-owner
          account).
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
        <p>
          Vendor ID (for reference):{" "}
          <code className="rounded bg-zinc-950 px-2 py-0.5 font-mono text-xs text-emerald-400/90">{vendorId}</code>
        </p>
        <p className="mt-4 leading-relaxed">
          Use the approved merchant&apos;s session to POST multipart uploads to vendor media endpoints. As an admin, you
          can still preview product images from the read-only products list when URLs are returned by GET.
        </p>
      </div>
    </div>
  );
}
