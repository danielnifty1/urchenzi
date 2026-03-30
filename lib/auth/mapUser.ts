import type { ApiAuthUser, UserSession } from "@/types";

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
    role: u.role,
    email: u.email,
    name,
  };
}
