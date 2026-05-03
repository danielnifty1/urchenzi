import type { UserRole, UserSession } from "@/types";

/**
 * Mirrors UsersService.isProfileComplete: firstName, lastName, phone, and address all non-empty after trim.
 */
export function isProfileComplete(user: UserSession | null | undefined): boolean {
  if (!user) return false;
  const first = user.firstName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  const phone = user.phone?.trim() ?? "";
  const address = user.address?.trim() ?? "";
  return first.length > 0 && last.length > 0 && phone.length > 0 && address.length > 0;
}

/** `role` query tells profile completion which role to send to POST /customers/onboard (API session may still be `customer` until persisted). */
export function profileCompletionPath(nextPath: string, intendedRole?: UserRole): string {
  const q = new URLSearchParams();
  q.set("next", nextPath);
  if (intendedRole) q.set("role", intendedRole);
  return `/onboarding/profile?${q.toString()}`;
}

export function parseUserRoleQueryParam(value: string | null): UserRole | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === "customer" || v === "vendor" || v === "rider" || v === "store_manager") return v;
  return undefined;
}
