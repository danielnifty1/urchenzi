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
