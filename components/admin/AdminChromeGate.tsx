"use client";

import { usePathname } from "next/navigation";
import { AdminGlobalChrome } from "@/components/admin/AdminGlobalChrome";
import { isAdminVendorWorkspacePath } from "@/lib/admin/adminRoutes";

/** Wraps admin app pages: full chrome except login and vendor UUID workspace. */
export function AdminChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/admin/login") {
    return <>{children}</>;
  }
  if (isAdminVendorWorkspacePath(pathname)) {
    return <>{children}</>;
  }
  return <AdminGlobalChrome>{children}</AdminGlobalChrome>;
}
