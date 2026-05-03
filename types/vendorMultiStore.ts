import type { VendorOrderStatus } from "@/types/orderStatus";

export type { OrderStatus, VendorOrderStatus } from "@/types/orderStatus";

export type VendorStoreStatus = "active" | "pending";

export type VendorStoreListItem = {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  /** From GET /stores (CreateStoreDto.address). */
  address?: string;
  status: VendorStoreStatus;
  orderCount?: number;
  revenue?: number;
};

/** @see OrderStatus — pending → accepted → ready → assigned → in_transit → delivered (+ optional cancelled). */

export type VendorOrderRow = {
  id: string;
  customerLabel: string;
  total: number;
  status: VendorOrderStatus;
  createdAt: string;
  storeId?: string;
  storeName?: string;
  /** Copied from store when the order was created. */
  assignmentMode?: "auto" | "manual";
  referenceCode?: string;
  riderId?: string;
};

export type VendorMonthlyPoint = {
  label: string;
  value: number;
};

export type VendorGlobalDashboard = {
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlySales: VendorMonthlyPoint[];
  ordersTrend: VendorMonthlyPoint[];
  recentOrders: VendorOrderRow[];
  /** True when some figures were synthesized client-side (no aggregate API). */
  partialData?: boolean;
};

export type VendorStoreAnalytics = {
  revenue: number;
  ordersCount: number;
  monthlyBreakdown: VendorMonthlyPoint[];
  bestSelling: { productId: string; name: string; units: number; revenue: number }[];
};
