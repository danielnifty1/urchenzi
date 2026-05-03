import type { ApiAuthUser, UserRole, UserSession, UserStatus } from "@/types";

function toRole(value: string): UserRole | undefined {
  const v = value.toLowerCase();
  if (v === "customer" || v === "vendor" || v === "rider" || v === "admin" || v === "store_manager") {
    return v as UserRole;
  }
  return undefined;
}

function toStatus(value: string | undefined): UserStatus | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === "pending" || v === "active" || v === "suspended" || v === "unverified") return v;
  if (v === "pending_verification") return "unverified";
  return undefined;
}

function toEmailVerified(u: ApiAuthUser): boolean | undefined {
  const raw =
    u.emailVerified ??
    u.email_verified ??
    u.isEmailVerified ??
    u.is_email_verified ??
    u.isEmailVerifed ??
    u.verified;
  if (raw === true || raw === false) return raw;
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
    emailVerified: toEmailVerified(u),
    email: u.email,
    name,
    firstName: first,
    lastName: last,
    phone: strOrEmpty(u.phone),
    address: strOrEmpty(u.address),
  };
}

type SessionOverrides = {
  status?: string;
  emailVerified?: boolean;
};

export function apiUserToSessionWithOverrides(
  u: ApiAuthUser,
  overrides: SessionOverrides = {},
  displayNameOverride?: string,
): UserSession {
  const base = apiUserToSession(u, displayNameOverride);
  return {
    ...base,
    status: toStatus(overrides.status) ?? base.status,
    emailVerified:
      typeof overrides.emailVerified === "boolean"
        ? overrides.emailVerified
        : base.emailVerified,
  };
}
