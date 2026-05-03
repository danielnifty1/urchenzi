"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { VendorOrderAlertsContext } from "@/contexts/VendorOrderAlertsContext";
import { useRepeatingOrderRing } from "@/hooks/useRepeatingOrderRing";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import { dashboardAccessibleStoresQueryKey, dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { listVendorOrdersScoped } from "@/services/vendorMultiStoreApi";
import { useUserStore } from "@/store/userStore";

/**
 * Polls all accessible stores’ orders while a vendor is signed in (any route) and
 * plays the alert ring when any store has pending orders. Shares query keys with
 * dashboard pages so work is deduped.
 */
export function VendorGlobalNotifications({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);
  const [dismissed, setDismissed] = useState(false);
  const prevUnattendedRef = useRef(0);

  const canPoll = Boolean(
    authResolved && user && user.role === "vendor" && isProfileComplete(user),
  );

  const storesQ = useQuery({
    queryKey: dashboardAccessibleStoresQueryKey(user?.role),
    queryFn: () => fetchMyAccessibleStores(),
    enabled: canPoll,
  });

  const stores = storesQ.data ?? [];

  const storeOrderQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: dashboardStoreKeys.orders(store.id),
      queryFn: () => listVendorOrdersScoped(store.id, { limit: 120 }),
      enabled: canPoll && stores.length > 0,
      refetchInterval: 12_000,
    })),
  });

  const unattendedByStoreId = useMemo(() => {
    const map = new Map<string, number>();
    stores.forEach((store, i) => {
      const rows = storeOrderQueries[i]?.data;
      if (!rows) return;
      map.set(store.id, rows.filter((o) => o.status === "pending").length);
    });
    return map;
  }, [stores, storeOrderQueries]);

  const attentionIdsForSound = useMemo(() => {
    const out: string[] = [];
    unattendedByStoreId.forEach((n, storeId) => {
      if (n > 0) out.push(`${storeId}:${n}`);
    });
    return out.sort((a, b) => a.localeCompare(b));
  }, [unattendedByStoreId]);

  const totalUnattended = useMemo(() => {
    let s = 0;
    unattendedByStoreId.forEach((n) => {
      s += n;
    });
    return s;
  }, [unattendedByStoreId]);

  useEffect(() => {
    const prev = prevUnattendedRef.current;
    if (totalUnattended === 0) {
      setDismissed(false);
    } else if (prev > 0 && totalUnattended !== prev) {
      setDismissed(false);
    }
    prevUnattendedRef.current = totalUnattended;
  }, [totalUnattended]);

  const { silenceRingingForNow, muted } = useRepeatingOrderRing({
    enabled: canPoll && storesQ.data !== undefined,
    ringWhile: totalUnattended > 0,
    kind: "alert",
    attentionIds: attentionIdsForSound,
  });

  const ctxValue = useMemo(() => {
    if (!canPoll) {
      return {
        silenceRingingForNow: () => {},
        muted: false,
        totalUnattendedOrders: 0,
      };
    }
    return {
      silenceRingingForNow,
      muted,
      totalUnattendedOrders: totalUnattended,
    };
  }, [canPoll, silenceRingingForNow, muted, totalUnattended]);

  /** Stores list page already shows an inline banner — avoid duplicate chrome. */
  const hideFloatingChrome =
    pathname === "/dashboard/stores" || pathname === "/dashboard/stores/";
  const showFloating = canPoll && totalUnattended > 0 && !hideFloatingChrome && !dismissed;

  return (
    <VendorOrderAlertsContext.Provider value={ctxValue}>
      {showFloating ? (
        <div
          className="pointer-events-none fixed bottom-4 right-4 left-4 z-[10048] flex justify-end sm:left-auto"
          aria-live="polite"
        >
          <div className="pointer-events-auto relative flex max-w-md flex-col gap-2 rounded-2xl border border-rose-500/45 bg-zinc-950/95 px-4 py-3 pr-12 text-sm text-rose-50 shadow-xl shadow-black/40 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-400/35 bg-transparent text-sm font-semibold leading-none text-rose-100 transition hover:bg-rose-900/35"
              aria-label="Close unattended order notification"
            >
              x
            </button>
            <p className="pr-2">
              <span className="font-semibold text-white">
                {totalUnattended === 1 ? "1 unattended order" : `${totalUnattended} unattended orders`}
              </span>
              <span className="mt-0.5 block text-xs text-rose-100/85">
                Pending across your stores — alert sound is on
                {muted ? " (muted for now)" : ""}.
              </span>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={silenceRingingForNow}
                className="rounded-xl border border-rose-400/50 bg-rose-950/60 px-3 py-2 text-xs font-semibold text-rose-50 transition hover:bg-rose-900/70"
              >
                Stop sound
              </button>
              <Link
                href="/dashboard/stores"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                View stores
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </VendorOrderAlertsContext.Provider>
  );
}
