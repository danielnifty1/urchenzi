"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";
import { needsEmailVerification } from "@/lib/auth/emailVerification";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { Footer } from "@/components/Footer";
import { useUserStore } from "@/store/userStore";

export function MainSiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const showVerifyBanner = needsEmailVerification(user);

  const isDashboardShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/vendor/dashboard");

  if (isDashboardShell) {
    return <>{children}</>;
  }

  return (
    <>
      <MainSiteHeader />
      <main
        className={clsx(
          "relative z-0 mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 pb-6 md:pb-8",
          showVerifyBanner
            ? "pt-[calc(11.5rem+env(safe-area-inset-top,0px))] md:pt-36"
            : "pt-[calc(8.5rem+env(safe-area-inset-top,0px))] md:pt-28",
        )}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
