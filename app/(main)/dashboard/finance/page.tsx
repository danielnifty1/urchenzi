 "use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FinanceDashboardPage } from "@/components/finance/FinanceDashboardPage";
import { dashboardAccessibleStoresQueryKey } from "@/lib/dashboard/queryKeys";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { useUserStore } from "@/store/userStore";

export default function DashboardFinancePage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const isStoreManager = user?.role === "store_manager";
  const isVendor = user?.role === "vendor";
  const storesQ = useQuery({
    queryKey: dashboardAccessibleStoresQueryKey(user?.role),
    queryFn: fetchMyAccessibleStores,
    enabled: isStoreManager,
  });

  useEffect(() => {
    if (isVendor) {
      router.replace("/vendor/dashboard/finance");
      return;
    }
    if (!isStoreManager) return;
    if (!storesQ.data?.length) return;
    router.replace(`/dashboard/stores/${storesQ.data[0].id}/finance`);
  }, [isStoreManager, isVendor, router, storesQ.data]);

  if (isStoreManager || isVendor) return null;
  return <FinanceDashboardPage />;
}
