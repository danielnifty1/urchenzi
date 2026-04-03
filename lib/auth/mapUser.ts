import type { ApiAuthUser, UserRole, UserSession, UserStatus } from "@/types";

function toRole(value: string): UserRole | undefined {
  const v = value.toLowerCase();
  if (v === "customer" || v === "vendor" || v === "rider") return v;
  return undefined;
}

function toStatus(value: string | undefined): UserStatus | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === "pending" || v === "active" || v === "suspended") return v;
  return undefined;
}

export function apiUserToSession(u: ApiAuthUser, displayNameOverride?: string): UserSession {
  const fromParts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  const name =
    displayNameOverride?.trim() ||
    fromParts ||
    u.email.split("@")[0] ||
    u.email;
  return {
    id: u.id,
    userid: u.userid,
    role: toRole(u.role),
    status: toStatus(u.status),
    email: u.email,
    name,
  };
}
