import type { ApiAuthUser, UserRole, UserSession, UserStatus } from "@/types";

function toRole(value: string): UserRole | undefined {
  const v = value.toLowerCase();
  if (v === "customer" || v === "vendor" || v === "rider" || v === "admin") return v;
  return undefined;
}

function toStatus(value: string | undefined): UserStatus | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === "pending" || v === "active" || v === "suspended") return v;
  return undefined;
}

function strOrEmpty(v: string | null | undefined): string | undefined {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t === "" ? undefined : t;
}

export function apiUserToSession(u: ApiAuthUser, displayNameOverride?: string): UserSession {
  const first = strOrEmpty(u.firstName);
  const last = strOrEmpty(u.lastName);
  const fromParts = [first, last].filter(Boolean).join(" ").trim();
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
    firstName: first,
    lastName: last,
    phone: strOrEmpty(u.phone),
    address: strOrEmpty(u.address),
  };
}
