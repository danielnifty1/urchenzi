"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getPaymentStatusByOrder } from "@/services/paymentApi";

export function usePaymentStatus(orderId: string | undefined, enabled = true) {
  const startedAtRef = useRef(Date.now());
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [orderId]);

  return useQuery({
    queryKey: ["payment-order-status", orderId],
    enabled: Boolean(orderId) && enabled,
    queryFn: ({ signal }) => getPaymentStatusByOrder(String(orderId), signal),
    refetchInterval: (q) => {
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed > 60_000) return false;
      if (q.state.data?.isPaid) return false;
      return 3_000;
    },
  });
}
