import { NextRequest, NextResponse } from "next/server";

/**
 * Dev-only proxy: browser → same-origin `/api/v1/*` → backend (see `lib/api/apiBase.ts`).
 * Avoids CORS and fixes flaky `rewrites()` in some dev setups.
 */
export const runtime = "nodejs";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function backendOrigin(): string {
  return (process.env.API_INTERNAL_ORIGIN ?? "http://127.0.0.1:3010").replace(/\/$/, "");
}

function normalizeDevSetCookie(header: string): string {
  // LAN dev often runs on http://172.x.x.x:3001 while backend is localhost.
  // Drop Domain/Secure so browser accepts cookie for current host over HTTP.
  let out = header.replace(/;\s*Domain=[^;]*/gi, "");
  out = out.replace(/;\s*Secure/gi, "");
  out = out.replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
  return out;
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path } = await ctx.params;
  const segments = path ?? [];
  const sub = segments.join("/");
  const target = `${backendOrigin()}/api/v1/${sub}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "host") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(target, init);
  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  });
  const setCookieValues =
    (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "transfer-encoding" || lower === "set-cookie") return;
    out.headers.append(key, value);
  });
  for (const cookie of setCookieValues) {
    out.headers.append("set-cookie", normalizeDevSetCookie(cookie));
  }
  return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
