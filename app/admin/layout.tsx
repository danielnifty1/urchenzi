import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { AdminChromeGate } from "@/components/admin/AdminChromeGate";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminChromeGate>{children}</AdminChromeGate>
    </AdminAuthProvider>
  );
}
