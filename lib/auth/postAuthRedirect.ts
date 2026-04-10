import type { UserSession } from "@/types";
import { needsEmailVerification } from "@/lib/auth/emailVerification";

/**
 * Post-login destination from API session (`role` + `status`).
 * Active users go to their role home; others to onboarding or account.
 */
export function getPostAuthRedirectPath(session: UserSession): string {
  if (needsEmailVerification(session)) {
    return "/verify-email";
  }

  const status = session.status ?? "pending";
  const role = session.role;

  if (status === "suspended") {
    return "/profile";
  }

  if (status === "pending") {
    return "/onboarding/select-role";
  }

  if (status !== "active") {
    return "/onboarding/select-role";
  }

  if (role === "vendor") return "/vendor/dashboard";
  if (role === "rider") return "/rider/dashboard";
  if (role === "customer") return "/";

  return "/onboarding/select-role";
}
