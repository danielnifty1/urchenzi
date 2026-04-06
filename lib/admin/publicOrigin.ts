import { getApiV1Base } from "@/lib/api/apiBase";

/** Origin for static `/uploads/...` URLs (strip `/api/v1` from resolved API base). */
export function apiPublicOrigin(): string {
  return getApiV1Base().replace(/\/api\/v1\/?$/i, "") || "http://localhost:3010";
}

export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = apiPublicOrigin().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
