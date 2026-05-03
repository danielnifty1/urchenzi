"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletTransactions } from "@/services/walletApi";

type WalletTransactionsOptions = {
  refetchInterval?: number | false;
};

export function useWalletTransactions(
  page: number,
  limit = 20,
  options?: WalletTransactionsOptions & { storeId?: string },
) {
  return useQuery({
    queryKey: ["wallet-transactions", options?.storeId ?? "all", page, limit],
    queryFn: ({ signal }) => getWalletTransactions({ page, limit, storeId: options?.storeId }, signal),
    refetchInterval: options?.refetchInterval,
  });
}
