"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocationSelector } from "@/components/LocationSelector";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { useThemeStore } from "@/store/themeStore";

export const Navbar = () => {
  const pathname = usePathname();
  const themeMode = useThemeStore((state) => state.mode);
  const themeHydrated = useThemeStore((state) => state.hasHydrated);
  const isHome = pathname === "/";
  const glovoNav = isHome && themeHydrated && themeMode === "light";

  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const user = useUserStore((state) => state.user);
  const authResolved = useUserStore((state) => state.authResolved);
  const logout = useUserStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep hook order stable across route transitions.
  if (pathname.startsWith("/store") || pathname.startsWith("/vendor/dashboard")) {
    return null;
  }

  const cartBadge = count > 0 && (
    <span
      className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
        glovoNav ? "bg-[#00A082] text-white" : "bg-accent text-black"
      }`}
    >
      {count}
    </span>
  );

  if (glovoNav) {
    return (
      <header className="fixed inset-x-0 top-0 z-[10050] isolate border-b border-black/5 bg-[#FFC244]/95 pt-[max(0px,env(safe-area-inset-top))] shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm [transform:translateZ(0)] md:sticky md:z-[100]">
        <nav className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 touch-manipulation md:justify-between md:gap-3">
            <div className="min-w-0 flex-1 overflow-hidden md:flex-none">
              <Link
                href="/"
                className="flex min-w-0 max-w-full items-center gap-1.5 text-xl font-black tracking-tight text-[#00A082] sm:text-2xl"
              >
                <span className="truncate">UrchenziConnect</span>
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFC244] text-xs ring-2 ring-[#00A082] sm:h-8 sm:w-8 sm:text-sm"
                  aria-hidden
                >
                  📍
                </span>
              </Link>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
              <LocationSelector variant="glovo" />
            </div>

            <div className="relative z-[2] flex min-h-11 shrink-0 items-center gap-2 md:gap-3">
              <ThemeToggle variant="glovo" />
              <Link
                href="/cart"
                className="relative rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-[#1a1a1a] shadow-md ring-1 ring-black/5 transition hover:bg-white md:px-4"
              >
                🛒
                {cartBadge}
              </Link>
              {!authResolved ? (
                <div className="h-10 w-20 animate-pulse rounded-full bg-white/60" />
              ) : user ? (
                <div className="group relative hidden sm:block">
                  <button
                    type="button"
                    className="rounded-full bg-[#00A082] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] md:px-4"
                  >
                    👤 {user.name.split(" ")[0]}
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border border-border bg-surface opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                    <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-background">
                      👤 Profile
                    </Link>
                    <Link href="/orders/history" className="block px-4 py-3 text-sm hover:bg-background">
                      📋 Order History
                    </Link>
                    {user.role === "vendor" && (
                      <Link
                        href="/vendor/dashboard"
                        className="block px-4 py-3 text-sm hover:bg-background"
                      >
                        🏪 Vendor dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => void logout()}
                      className="w-full px-4 py-3 text-left text-sm text-error hover:bg-background"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="relative z-[3] flex items-center gap-2 rounded-full bg-[#00A082] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] md:px-5"
                >
                  <span aria-hidden>👤</span>
                  Login
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative z-[3] inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 [-webkit-tap-highlight-color:transparent] hover:bg-black/5 active:bg-black/10 md:hidden"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 space-y-2 border-t border-black/10 pt-3 md:hidden">
              <div className="flex justify-center py-2">
                <LocationSelector variant="glovo" />
              </div>
              <Link href="/promos" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5">
                Promos
              </Link>
              <Link href="/orders/history" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5">
                Orders
              </Link>
              {user && (
                <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5">
                  Profile
                </Link>
              )}
            </div>
          )}
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[10050] isolate border-b border-border bg-surface/95 pt-[max(0px,env(safe-area-inset-top))] shadow-[0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm [transform:translateZ(0)] md:sticky md:z-[100]">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex min-w-0 items-center gap-3 touch-manipulation md:justify-between md:gap-4">
          <div className="min-w-0 flex-1 overflow-hidden md:flex-none">
            <Link href="/" className="flex min-w-0 max-w-full items-center gap-2">
              <div className="flex shrink-0 items-center gap-1">
                <div className="font-black text-brand text-2xl">U</div>
                <div className="font-black text-accent text-2xl">C</div>
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-xs font-bold tracking-wider text-foreground">URCHENZI CONNECT</div>
                <div className="truncate text-xs font-medium text-muted">Your Community, Connected</div>
              </div>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-foreground transition hover:text-brand">
              Home
            </Link>
            <Link href="/promos" className="text-sm font-medium text-foreground transition hover:text-brand">
              Promos
            </Link>
            <Link href="/orders/history" className="text-sm font-medium text-foreground transition hover:text-brand">
              Orders
            </Link>
          </div>

          <div className="hidden lg:block">
            <LocationSelector />
          </div>

          <div className="relative z-[2] flex min-h-11 shrink-0 items-center gap-2 touch-manipulation md:gap-3">
            <span className="relative z-[3]">
              <ThemeToggle variant="default" />
            </span>
            <Link
              href="/cart"
              className="relative z-[3] rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark md:px-4"
            >
              🛒
              {cartBadge}
            </Link>
              {!authResolved ? (
                <div className="hidden h-10 w-20 animate-pulse rounded-full bg-background sm:block" />
              ) : user ? (
              <div className="group relative hidden sm:block">
                <button
                  type="button"
                  className="rounded-full border-2 border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 md:px-4"
                >
                  👤 {user.name.split(" ")[0]}
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border border-border bg-surface opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-background">
                    👤 Profile
                  </Link>
                  <Link href="/orders/history" className="block px-4 py-3 text-sm hover:bg-background">
                    📋 Order History
                  </Link>
                  {user.role === "vendor" && (
                    <Link
                      href="/vendor/dashboard"
                      className="block px-4 py-3 text-sm hover:bg-background"
                    >
                      🏪 Vendor dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => void logout()}
                    className="w-full px-4 py-3 text-left text-sm text-error hover:bg-background"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="relative z-[3] rounded-full border-2 border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 md:px-4"
              >
                Login
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-[3] inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 [-webkit-tap-highlight-color:transparent] hover:bg-background active:bg-border md:hidden"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 space-y-2 border-t border-border pt-3 md:hidden">
            <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-background">
              Home
            </Link>
            <Link href="/promos" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-background">
              Promos
            </Link>
            <Link href="/orders/history" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-background">
              Orders
            </Link>
            {user && (
              <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-background">
                Profile
              </Link>
            )}
            <div className="px-3 pt-2">
              <LocationSelector />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
