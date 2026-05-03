import type { RiderOrder } from "@/services/riderApi";

/** Assigned to you but not yet accepted or rejected — drives accept/reject UI and alert sounds. */
export function orderNeedsAcceptOrReject(o: RiderOrder): boolean {
  if (o.status !== "assigned") return false;
  const accepted = Boolean(o.riderAcceptedAt && String(o.riderAcceptedAt).trim());
  return !accepted;
}
