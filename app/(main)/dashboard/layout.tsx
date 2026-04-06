import { DashboardAuthGate } from "@/components/dashboard/DashboardAuthGate";
import { DashboardProviders } from "@/components/dashboard/DashboardProviders";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGate>
      <DashboardProviders>{children}</DashboardProviders>
    </DashboardAuthGate>
  );
}
