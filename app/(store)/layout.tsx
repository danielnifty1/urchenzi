import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

/**
 * Storefront routes skip the global max-width main + footer (Faji-style full-width UI).
 * Uses a route group so we never rely on `usePathname()` branching (avoids hydration errors).
 */
export default function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col">
      <EmailVerificationBanner />
      {children}
    </div>
  );
}
