"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { StoreDashboardProvider } from "@/contexts/StoreDashboardContext";
import { StoreDashboardShell } from "@/components/dashboard/StoreDashboardShell";
import { isValidStoreId } from "@/lib/dashboard/storeId";

export default function DashboardStoreWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const storeId = String(params.storeId ?? "");

  if (!isValidStoreId(storeId)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Invalid store id</p>
        <p className="mt-2 text-sm text-muted">Use a UUID (stores.id) in the URL.</p>
        <Link href="/dashboard/stores" className="mt-6 inline-block text-sm font-medium text-[#00A082] hover:underline">
          Back to stores
        </Link>
      </div>
    );
  }

  return (
    <StoreDashboardProvider storeId={storeId}>
      <StoreDashboardShell>{children}</StoreDashboardShell>
    </StoreDashboardProvider>
  );
}
