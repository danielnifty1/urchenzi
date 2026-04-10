import type { UserSession } from "@/types";

/** True when the user must verify email before using the app (checks flag + common status values). */
export function needsEmailVerification(session: UserSession | null | undefined): boolean {
  if (!session) return false;
  if (session.emailVerified === true) return false;
  if (session.emailVerified === false) return true;
  const s = session.status?.toLowerCase();
  if (
    s === "unverified" ||
    s === "pending_verification" ||
    s === "pending" ||
    s === "awaiting_verification"
  ) {
    return true;
  }
  return false;
}
