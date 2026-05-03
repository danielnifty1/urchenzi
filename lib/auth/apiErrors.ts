import axios from "axios";

export function getApiErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { code?: string } | undefined;
    if (data?.code && typeof data.code === "string") return data.code;
  }
  return undefined;
}

export function isPermissionDeniedError(err: unknown): boolean {
  return getApiErrorCode(err) === "PERMISSION_DENIED";
}

export function isProfileIncompleteError(err: unknown): boolean {
  return getApiErrorCode(err) === "PROFILE_INCOMPLETE";
}

export function isRiderOnboardingIncompleteError(err: unknown): boolean {
  return getApiErrorCode(err) === "RIDER_ONBOARDING_INCOMPLETE";
}

/** No rider row yet — call POST /riders/onboard first (replaces older 404-only handling). */
export function isRiderOnboardingRequiredError(err: unknown): boolean {
  return getApiErrorCode(err) === "RIDER_ONBOARDING_REQUIRED";
}

export function shouldRedirectToRiderOnboarding(err: unknown): boolean {
  if (isRiderOnboardingRequiredError(err)) return true;
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[]; error?: string; code?: string }
      | undefined;
    if (data?.code === "PROFILE_INCOMPLETE") {
      return "Complete your first name, last name, phone, and address before continuing.";
    }
    if (data?.code === "PERMISSION_DENIED") {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      return msg && String(msg).trim() !== ""
        ? String(msg)
        : "You do not have permission to perform this action.";
    }
    if (data?.code === "AUTH_REQUIRED") {
      return "Please sign in again.";
    }
    if (data?.code === "INVITE_EXPIRED" || err.response?.status === 410) {
      const msg = Array.isArray(data?.message) ? data?.message.join(", ") : data?.message;
      return msg && String(msg).trim() !== ""
        ? String(msg)
        : "This invitation has expired. Ask the store owner to send a new one.";
    }
    if (data?.code === "RIDER_ONBOARDING_INCOMPLETE") {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      return msg && String(msg).trim() !== ""
        ? String(msg)
        : "Upload all required rider documents before using delivery features.";
    }
    if (data?.code === "RIDER_ONBOARDING_REQUIRED") {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      return msg && String(msg).trim() !== ""
        ? String(msg)
        : "Create your rider profile first, then upload documents.";
    }
    if (data?.code === "MIN_BALANCE_REQUIRED") {
      return "A minimum wallet balance of 100 must remain after withdrawal.";
    }
    if (data?.code === "INSUFFICIENT_BALANCE") {
      return "Insufficient wallet balance for this withdrawal.";
    }
    if (data?.code === "STORE_BANK_DETAILS_REQUIRED") {
      return "Complete store bank details before requesting a withdrawal.";
    }
    if (data?.code === "RIDER_BANK_DETAILS_REQUIRED") {
      return "Complete rider bank details before requesting a withdrawal.";
    }
    if (data?.code === "PAYSTACK_RECIPIENT_CREATE_FAILED") {
      return "Unable to create payout recipient right now. Please retry shortly.";
    }
    if (data?.code === "PAYSTACK_TRANSFER_FAILED") {
      return "Transfer submission failed. Please retry shortly.";
    }
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
    if (data?.error) return data.error;
    if (err.response?.status === 401) return "Invalid email or password.";
    if (err.response?.status === 404) return "Service not found. Check NEXT_PUBLIC_API_URL.";
    if ([500, 502, 503, 504].includes(err.response?.status ?? 0)) {
      return "The server is temporarily unavailable. Please try again shortly.";
    }
    if (err.code === "ECONNABORTED") {
      return "The request timed out. Please check your connection and try again.";
    }
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the server right now. Please check your network or try again shortly.";
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
