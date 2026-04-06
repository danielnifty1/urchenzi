"use client";

import { AdminSidebarLayout } from "@/components/admin/AdminSidebarLayout";

export function AdminGlobalChrome({ children }: { children: React.ReactNode }) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
