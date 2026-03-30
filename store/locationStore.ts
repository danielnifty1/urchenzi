"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { savedAddresses } from "@/services/mockData";
import { Address } from "@/types";

type LocationStore = {
  addresses: Address[];
  selectedAddress: Address;
  addAddress: (address: Address) => void;
  selectAddress: (address: Address) => void;
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      addresses: savedAddresses,
      selectedAddress: savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0],
      addAddress: (address) =>
        set((state) => {
          const next = [address, ...state.addresses];
          return { addresses: next, selectedAddress: address };
        }),
      selectAddress: (address) => {
        const exists = get().addresses.some((item) => item.id === address.id);
        if (exists) {
          set({ selectedAddress: address });
          return;
        }
        set((state) => ({ addresses: [address, ...state.addresses], selectedAddress: address }));
      },
    }),
    { name: "urchenzi-location" },
  ),
);
