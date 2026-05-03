"use client";

import { FinanceDashboardPage } from "@/components/finance/FinanceDashboardPage";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";

export default function StoreFinancePage() {
  const { storeId } = useStoreDashboard();
  return <FinanceDashboardPage forcedStoreId={storeId} />;
}
