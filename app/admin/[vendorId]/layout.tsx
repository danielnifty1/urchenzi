"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { isValidVendorId } from "@/lib/admin/uuid";
import Link from "next/link";

export default function AdminVendorLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");
  const { user } = useAdminAuth();

  if (!user || user.role !== "admin") {
    return null;
  }

  if (!isValidVendorId(vendorId)) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-16 text-center text-zinc-300">
        <p className="text-lg font-semibold text-white">Invalid vendor ID</p>
        <p className="mt-2 text-sm text-zinc-500">Use a UUID format in the URL.</p>
        <Link href="/admin" className="mt-6 inline-block text-emerald-500 hover:underline">
          Back to admin home
        </Link>
      </div>
    );
  }

  return <AdminShell vendorId={vendorId}>{children}</AdminShell>;
}
