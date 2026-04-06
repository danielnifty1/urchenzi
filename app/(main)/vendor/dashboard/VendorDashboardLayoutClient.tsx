"use client";

import { DashboardShell } from "@/components/vendor/DashboardShell";
import { VendorGate } from "@/components/vendor/VendorGate";

export function VendorDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorGate>
      <DashboardShell>{children}</DashboardShell>
    </VendorGate>
  );
}
