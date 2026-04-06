import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UUID =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

/**
 * Legacy URLs: /dashboard/:uuid → /dashboard/stores/:uuid
 * (avoids clashing with /dashboard/stores as a static segment).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard" || parts.length < 2) return NextResponse.next();
  const maybeId = parts[1];
  if (maybeId === "stores") return NextResponse.next();
  if (!UUID.test(maybeId)) return NextResponse.next();

  const rest = parts.slice(2).join("/");
  const target = rest ? `/dashboard/stores/${maybeId}/${rest}` : `/dashboard/stores/${maybeId}`;
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
