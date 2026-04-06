/**
 * NEXT_PUBLIC_API_URL is the API origin only (e.g. https://api.example.com).
 * The axios client always uses `<origin>/api/v1` as baseURL.
 * If the env already ends with `/api/v1`, it is used as-is for backward compatibility.
 */
export function getApiV1Base(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3010").trim().replace(/\/$/, "");
  if (raw.endsWith("/api/v1")) return raw;
  return `${raw}/api/v1`;
}
