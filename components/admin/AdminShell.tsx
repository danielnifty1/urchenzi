"use client";

import { AdminSidebarLayout } from "@/components/admin/AdminSidebarLayout";

export function AdminShell({
  vendorId,
  children,
}: {
  vendorId: string;
  children: React.ReactNode;
}) {
  return <AdminSidebarLayout vendorId={vendorId}>{children}</AdminSidebarLayout>;
}
