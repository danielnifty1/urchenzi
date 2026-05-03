"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletBalance, getWalletSummary } from "@/services/walletApi";

export function useWalletSummary(storeId?: string) {
  return useQuery({
    queryKey: ["wallet-summary", storeId ?? "all"],
    queryFn: ({ signal }) => getWalletSummary(signal, storeId),
  });
}

export function useWalletBalance(storeId?: string) {
  return useQuery({
    queryKey: ["wallet-balance", storeId ?? "all"],
    queryFn: ({ signal }) => getWalletBalance(signal, storeId),
  });
}
