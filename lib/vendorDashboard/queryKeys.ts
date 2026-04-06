export const vendorDashboardKeys = {
  all: ["vendor-dashboard"] as const,
  overview: () => [...vendorDashboardKeys.all, "overview"] as const,
  settings: () => [...vendorDashboardKeys.all, "settings"] as const,
  features: () => [...vendorDashboardKeys.all, "features"] as const,
  products: (filters: { search: string; category: string; inStock: boolean | undefined }) =>
    [...vendorDashboardKeys.all, "products", filters] as const,
};
