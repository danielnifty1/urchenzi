"use client";

import { useMutation } from "@tanstack/react-query";
import { initializePayment } from "@/services/paymentApi";

export function useInitializePayment() {
  return useMutation({
    mutationFn: (orderId: string) => initializePayment({ orderId }),
  });
}
