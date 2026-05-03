"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepeatingOrderRing } from "@/hooks/useRepeatingOrderRing";
import { useRiderSocket } from "@/hooks/useRiderSocket";
import { orderNeedsAcceptOrReject } from "@/lib/rider/riderOrderUtils";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import { getRiderMe, getRiderOrders } from "@/services/riderApi";
import { useUserStore } from "@/store/userStore";

/**
 * While a rider is signed in (any page), polls orders + Socket.IO and plays the
 * repeating assignment ring when a run needs accept/reject. Rider dashboard uses
 * the same React Query keys so data stays shared.
 */
export function RiderGlobalNotifications() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);

  const canFetchRider = Boolean(
    authResolved && user && user.role === "rider" && isProfileComplete(user),
  );

  const riderQ = useQuery({
    queryKey: ["rider-me"],
    queryFn: getRiderMe,
    enabled: canFetchRider,
  });

  const riderCanDispatch =
    riderQ.isSuccess &&
    riderQ.data &&
    riderQ.data.revalidationPending !== true &&
    (riderQ.data.status === undefined || riderQ.data.status === "approved") &&
    riderQ.data.onboardingComplete !== false;

  const ordersQ = useQuery({
    queryKey: ["rider-orders"],
    queryFn: getRiderOrders,
    enabled: riderCanDispatch,
    refetchInterval: 15_000,
  });

  const awaitingAcceptReject = useMemo(
    () => (ordersQ.data ?? []).filter(orderNeedsAcceptOrReject),
    [ordersQ.data],
  );

  const attentionIds = useMemo(() => awaitingAcceptReject.map((o) => o.id), [awaitingAcceptReject]);

  const { silenceRingingForNow, muted } = useRepeatingOrderRing({
    enabled: riderCanDispatch && ordersQ.data !== undefined,
    ringWhile: awaitingAcceptReject.length > 0,
    kind: "assignment",
    attentionIds,
  });

  useRiderSocket(riderCanDispatch ? riderQ.data?.id : undefined, queryClient);

  if (!riderCanDispatch || awaitingAcceptReject.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 left-4 z-[10050] flex justify-end sm:left-auto"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-w-md flex-col gap-2 rounded-2xl border border-amber-500/45 bg-zinc-950/95 px-4 py-3 text-sm text-amber-50 shadow-xl shadow-black/40 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="pr-2">
          <span className="font-semibold text-white">
            {awaitingAcceptReject.length === 1 ? "New ride" : `${awaitingAcceptReject.length} rides`} need
            a response
          </span>
          <span className="mt-0.5 block text-xs text-amber-100/85">
            Alert sound is on{muted ? " (muted for now)" : ""}.
          </span>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={silenceRingingForNow}
            className="rounded-xl border border-amber-400/50 bg-amber-950/60 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-900/70"
          >
            Stop sound
          </button>
          <Link
            href="/rider/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[#00A082] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#008f72]"
          >
            Open rider dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
