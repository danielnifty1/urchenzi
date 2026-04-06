"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Value = {
  /** `null` = aggregate all stores on the global dashboard. */
  overviewFilterStoreId: string | null;
  setOverviewFilterStoreId: (id: string | null) => void;
};

const VendorDashboardSelectionContext = createContext<Value | null>(null);

export function VendorDashboardSelectionProvider({ children }: { children: React.ReactNode }) {
  const [overviewFilterStoreId, setOverviewFilterStoreIdState] = useState<string | null>(null);

  const setOverviewFilterStoreId = useCallback((id: string | null) => {
    setOverviewFilterStoreIdState(id);
  }, []);

  const value = useMemo(
    () => ({ overviewFilterStoreId, setOverviewFilterStoreId }),
    [overviewFilterStoreId, setOverviewFilterStoreId],
  );

  return (
    <VendorDashboardSelectionContext.Provider value={value}>{children}</VendorDashboardSelectionContext.Provider>
  );
}

export function useVendorDashboardSelection(): Value {
  const ctx = useContext(VendorDashboardSelectionContext);
  if (!ctx) {
    throw new Error("useVendorDashboardSelection must be used under VendorDashboardSelectionProvider");
  }
  return ctx;
}
