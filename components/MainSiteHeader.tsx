"use client";

import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { Navbar } from "@/components/Navbar";

/** Fixed stack: activation banner (when needed) above main site navbar — matches product-style global alerts. */
export function MainSiteHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-[10050] flex w-full flex-col [transform:translateZ(0)] pt-[max(0px,env(safe-area-inset-top))]">
      <EmailVerificationBanner />
      <Navbar />
    </div>
  );
}
