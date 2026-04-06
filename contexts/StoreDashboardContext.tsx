"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyStorePermissions, type MyStorePermissionsResponse } from "@/services/authzApi";
import { ACTIVE_STORE_STORAGE_KEY, setActiveStoreId } from "@/lib/store/activeStoreId";
import type { PermissionSlug } from "@/lib/rbac/slugs";
import { useUserStore } from "@/store/userStore";

type StoreDashboardContextValue = {
  storeId: string;
  permissions: MyStorePermissionsResponse & { _fallback?: boolean };
  isLoading: boolean;
  error: Error | null;
  refetchPermissions: () => void;
  can: (slug: PermissionSlug) => boolean;
  canAny: (slugs: PermissionSlug[]) => boolean;
};

const StoreDashboardContext = createContext<StoreDashboardContextValue | null>(null);

export function StoreDashboardProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  const platformRole = useUserStore((s) => s.user?.role);

  if (typeof window !== "undefined") {
    setActiveStoreId(storeId);
    try {
      localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, storeId);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveStoreId(storeId);
    try {
      localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, storeId);
    } catch {
      /* ignore */
    }
    return () => {
      setActiveStoreId(null);
    };
  }, [storeId]);

  const q = useQuery({
    queryKey: ["authz-store-permissions", storeId, platformRole],
    queryFn: () => fetchMyStorePermissions(storeId, { platformUserRole: platformRole }),
    staleTime: 60_000,
  });

  const permSet = useMemo(() => new Set(q.data?.permissions ?? []), [q.data?.permissions]);
  const isSuperAdmin = Boolean(q.data?.isSuperAdmin);

  const can = useCallback(
    (slug: PermissionSlug) => isSuperAdmin || permSet.has(slug),
    [isSuperAdmin, permSet],
  );

  const canAny = useCallback(
    (slugs: PermissionSlug[]) => isSuperAdmin || slugs.some((s) => permSet.has(s)),
    [isSuperAdmin, permSet],
  );

  const value = useMemo((): StoreDashboardContextValue => {
    const permissions = q.data ?? { permissions: [] as string[], isSuperAdmin: false };
    return {
      storeId,
      permissions,
      isLoading: q.isLoading,
      error: q.error as Error | null,
      refetchPermissions: () => {
        void q.refetch();
      },
      can,
      canAny,
    };
  }, [storeId, q.data, q.isLoading, q.error, q.refetch, can, canAny]);

  return <StoreDashboardContext.Provider value={value}>{children}</StoreDashboardContext.Provider>;
}

export function useStoreDashboard(): StoreDashboardContextValue {
  const ctx = useContext(StoreDashboardContext);
  if (!ctx) {
    throw new Error("useStoreDashboard must be used under StoreDashboardProvider");
  }
  return ctx;
}
