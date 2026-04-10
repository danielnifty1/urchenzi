"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { needsEmailVerification } from "@/lib/auth/emailVerification";
import { useUserStore } from "@/store/userStore";

export function VendorGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);

  useEffect(() => {
    if (!authResolved) return;
    if (!user) {
      router.replace("/login?returnUrl=/vendor/dashboard");
      return;
    }
    if (needsEmailVerification(user)) {
      router.replace("/verify-email");
      return;
    }
    if (user.role !== "vendor") {
      router.replace("/");
    }
  }, [authResolved, user, router]);

  if (!authResolved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent" />
      </div>
    );
  }

  if (!user || needsEmailVerification(user) || user.role !== "vendor") {
    return null;
  }

  return <>{children}</>;
}
