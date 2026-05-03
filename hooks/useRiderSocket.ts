"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { getApiV1Base } from "@/lib/api/apiBase";

function socketOrigin(): string {
  const base = getApiV1Base();
  return base.replace(/\/api\/v1\/?$/, "");
}

/**
 * Connects to backend Socket.IO namespace `/riders` with `?riderId=` (MVP auth).
 * Invalidates rider queries when assignment-related events fire.
 * Repeating ring audio is driven by useRepeatingOrderRing on the rider dashboard.
 */
export function useRiderSocket(riderId: string | undefined, queryClient: QueryClient) {
  useEffect(() => {
    if (!riderId) return;

    const socket = io(`${socketOrigin()}/riders`, {
      query: { riderId },
      transports: ["websocket", "polling"],
    });

    const bump = () => {
      void queryClient.invalidateQueries({ queryKey: ["rider-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["rider-me"] });
    };

    socket.on("order.assigned", bump);
    socket.on("rider.notified", bump);
    socket.on("rider.accepted", bump);
    socket.on("rider.rejected", bump);
    socket.on("order.delivery_failed", bump);

    return () => {
      socket.disconnect();
    };
  }, [riderId, queryClient]);
}
