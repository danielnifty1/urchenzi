/** Accessible stores: vendor uses GET /stores; store_manager uses GET /store-manager/stores. */
export function dashboardAccessibleStoresQueryKey(role: string | undefined) {
  return ["dashboard-accessible-stores", role ?? "anonymous"] as const;
}

export const dashboardStoreKeys = {
  all: ["dashboard-store"] as const,
  store: (storeId: string) => [...dashboardStoreKeys.all, storeId] as const,
  products: (
    storeId: string,
    filters: { search: string; category: string; inStock: boolean | undefined },
  ) => [...dashboardStoreKeys.store(storeId), "products", filters] as const,
  orders: (storeId: string) => [...dashboardStoreKeys.store(storeId), "orders"] as const,
  analytics: (storeId: string) => [...dashboardStoreKeys.store(storeId), "analytics"] as const,
  settings: (storeId: string) => [...dashboardStoreKeys.store(storeId), "settings"] as const,
  assignmentMode: (storeId: string) => [...dashboardStoreKeys.store(storeId), "assignment-mode"] as const,
  availableRiders: (storeId: string) => [...dashboardStoreKeys.store(storeId), "available-riders"] as const,
};
