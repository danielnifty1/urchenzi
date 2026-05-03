import { http } from "@/lib/api/client";

function unwrap(data: unknown): unknown {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: unknown }).data;
  }
  return data;
}

/** GET /admin/riders/:riderId — full moderation view (rider, user, KYC, onboarding). */
export async function fetchAdminRiderById(riderId: string): Promise<unknown> {
  const { data } = await http.get<unknown>(`/admin/riders/${encodeURIComponent(riderId)}`, {
    skipStoreContext: true,
  });
  return unwrap(data);
}

const REJECT_REASON_MAX = 2000;

/** POST /admin/riders/:riderId/approve — requires all four KYC document URLs. */
export async function adminRiderApprove(riderId: string): Promise<void> {
  await http.post(`/admin/riders/${encodeURIComponent(riderId)}/approve`, {}, { skipStoreContext: true });
}

/** POST /admin/riders/:riderId/reject — optional reason (max 2000 chars); rider → pending. */
export async function adminRiderReject(riderId: string, body?: { reason?: string }): Promise<void> {
  const reason = body?.reason?.trim();
  const payload =
    reason && reason.length > 0 ? { reason: reason.slice(0, REJECT_REASON_MAX) } : {};
  await http.post(`/admin/riders/${encodeURIComponent(riderId)}/reject`, payload, { skipStoreContext: true });
}

/** POST /admin/riders/:riderId/suspend — linked user → suspended */
export async function adminRiderSuspend(riderId: string): Promise<void> {
  await http.post(`/admin/riders/${encodeURIComponent(riderId)}/suspend`, {}, { skipStoreContext: true });
}

/** POST /admin/riders/:riderId/ban — linked user → banned */
export async function adminRiderBan(riderId: string): Promise<void> {
  await http.post(`/admin/riders/${encodeURIComponent(riderId)}/ban`, {}, { skipStoreContext: true });
}

/** POST /admin/riders/:riderId/reinstate — linked user → active */
export async function adminRiderReinstate(riderId: string): Promise<void> {
  await http.post(`/admin/riders/${encodeURIComponent(riderId)}/reinstate`, {}, { skipStoreContext: true });
}
