/**
 * NEXT_PUBLIC_API_URL is the API origin only (e.g. https://api.example.com).
 * The axios client uses `<origin>/api/v1` as baseURL.
 * If the env already ends with `/api/v1`, it is used as-is for backward compatibility.
 *
 * **Development + localhost in env:** the browser would call `http://localhost:3010` while the page
 * is `http://172.20.10.4:3001`. That is cross-origin; many backends only allow `localhost` as Origin,
 * so `/auth/refresh` fails and `/login` stays on "Loading…". We avoid that by using the **same origin**
 * as the page (`window.location.origin`) and proxying `/api/v1/*` to the backend (see `next.config.ts`).
 *
 * **Server-side** (RSC, no `window`): requests go to `http://127.0.0.1:<port>` so they hit the backend
 * directly without relying on the dev hostname.
 */
const DEFAULT_API_PORT = (process.env.NEXT_PUBLIC_API_PORT ?? "3010").trim();

function trimApiV1(raw: string): string {
  const r = raw.replace(/\/$/, "");
  if (r.endsWith("/api/v1")) return r;
  return `${r}/api/v1`;
}

function isLocalDevApiUrl(value: string): boolean {
  try {
    const u = new URL(value.startsWith("http") ? value : `http://${value}`);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
    
  }
}

export function getApiV1Base(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isDev = process.env.NODE_ENV === "development";

  // Dev: same-origin /api/v1 → Next rewrite → backend (no CORS; works on LAN IP and localhost).
  if (isDev && (!fromEnv || isLocalDevApiUrl(fromEnv))) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1`;
    }
    return `http://127.0.0.1:${DEFAULT_API_PORT}/api/v1`;
  }

  if (fromEnv) {
    if (typeof window !== "undefined") {
      try {
        const u = new URL(fromEnv.startsWith("http") ? fromEnv : `http://${fromEnv}`);
        if (
          (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          const port = u.port || DEFAULT_API_PORT;
          return trimApiV1(`${window.location.protocol}//${window.location.hostname}:${port}`);
        }
      } catch {
        // fall through
      }
    }
    return trimApiV1(fromEnv);
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:${DEFAULT_API_PORT}/api/v1`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}/api/v1`;
}
