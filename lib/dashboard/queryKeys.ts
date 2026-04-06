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
};
