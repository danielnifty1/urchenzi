"use client";

import { VendorDashboardSelectionProvider } from "@/contexts/VendorDashboardSelectionContext";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <VendorDashboardSelectionProvider>{children}</VendorDashboardSelectionProvider>;
}
