import axios from "axios";

const friendlyByCode: Record<string, string> = {
  ACCOUNT_SUSPENDED: "This account is suspended.",
  ACCOUNT_BANNED: "This account is banned.",
  ASSIGNMENT_EXISTS: "This role is already assigned for that user and scope.",
  ROLE_ALREADY_ASSIGNED: "This role is already assigned for that user and scope.",
};

/** Surfaces Nest-style `{ message, code, errors }` for admin UI. */
export function formatAdminError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as
      | {
          message?: string | string[];
          code?: string;
          errors?: Record<string, string[]>;
        }
      | undefined;
    if (d?.code && friendlyByCode[d.code]) {
      return friendlyByCode[d.code];
    }
    const parts: string[] = [];
    if (d?.code) parts.push(`[${d.code}]`);
    if (d?.message) {
      parts.push(Array.isArray(d.message) ? d.message.join(", ") : d.message);
    } else if (err.response?.status) {
      const status = err.response.status;
      if ([500, 502, 503, 504].includes(status)) {
        parts.push("Server temporarily unavailable. Please retry in a moment.");
      } else {
        parts.push(`HTTP ${status}`);
      }
    }
    if (err.code === "ECONNABORTED") {
      parts.push("Request timed out. Check connectivity and retry.");
    }
    if (err.code === "ERR_NETWORK") {
      parts.push("Cannot reach the server. please try again.");
    }
    if (d?.errors && typeof d.errors === "object") {
      for (const [k, v] of Object.entries(d.errors)) {
        if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
      }
    }
    if (parts.length) return parts.join(" ");
  }
  if (err instanceof Error) return err.message;
  return "Request failed.";
}
