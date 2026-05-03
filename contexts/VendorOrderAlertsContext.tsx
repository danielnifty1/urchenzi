"use client";

import { createContext, useContext } from "react";

export type VendorOrderAlertsValue = {
  silenceRingingForNow: () => void;
  muted: boolean;
  /** Pending orders across all accessible stores (new orders awaiting action). */
  totalUnattendedOrders: number;
};

const defaultValue: VendorOrderAlertsValue = {
  silenceRingingForNow: () => {},
  muted: false,
  totalUnattendedOrders: 0,
};

export const VendorOrderAlertsContext = createContext<VendorOrderAlertsValue>(defaultValue);

export function useVendorOrderAlerts() {
  return useContext(VendorOrderAlertsContext);
}
