import { VendorDashboardLayoutClient } from "./VendorDashboardLayoutClient";

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorDashboardLayoutClient>{children}</VendorDashboardLayoutClient>;
}
