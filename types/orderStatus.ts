/** Shared order lifecycle (vendor + rider). Rider accept → `InTransit` (en route to customer). */
export enum OrderStatus {
  Pending = "pending",
  Accepted = "accepted",
  Ready = "ready",
  Assigned = "assigned",
  /** Rider accepted the delivery; en route to customer. */
  InTransit = "in_transit",
  Delivered = "delivered",
  /** Rider could not complete handoff (after assigned or in_transit). */
  DeliveryFailed = "delivery_failed",
  /** Terminal — order closed. */
  Cancelled = "cancelled",
}

export type VendorOrderStatus = OrderStatus;
