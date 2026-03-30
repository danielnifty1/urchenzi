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
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#FFC244]/95 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <nav className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex flex-shrink-0 items-center gap-1.5 text-xl font-black tracking-tight text-[#00A082] sm:text-2xl"
            >
              <span>UrchenziConnect</span>
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFC244] text-xs ring-2 ring-[#00A082] sm:h-8 sm:w-8 sm:text-sm"
                aria-hidden
              >
                📍
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
              <LocationSelector variant="glovo" />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
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
                  <button className="rounded-full bg-[#00A082] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] md:px-4">
                    👤 {user.name.split(" ")[0]}
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border border-border bg-surface opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                    <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-background">
                      👤 Profile
                    </Link>
                    <Link href="/orders/history" className="block px-4 py-3 text-sm hover:bg-background">
                      📋 Order History
                    </Link>
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
                  className="flex items-center gap-2 rounded-full bg-[#00A082] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] md:px-5"
                >
                  <span aria-hidden>👤</span>
                  Login
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 hover:bg-black/5 md:hidden"
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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 shadow-[0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="font-black text-brand text-2xl">U</div>
              <div className="font-black text-accent text-2xl">C</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold tracking-wider text-foreground">URCHENZI CONNECT</div>
              <div className="text-xs font-medium text-muted">Your Community, Connected</div>
            </div>
          </Link>

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

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle variant="default" />
            <Link
              href="/cart"
              className="relative rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark md:px-4"
            >
              🛒
              {cartBadge}
            </Link>
              {!authResolved ? (
                <div className="hidden h-10 w-20 animate-pulse rounded-full bg-background sm:block" />
              ) : user ? (
              <div className="group relative hidden sm:block">
                <button className="rounded-full border-2 border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 md:px-4">
                  👤 {user.name.split(" ")[0]}
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border border-border bg-surface opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-background">
                    👤 Profile
                  </Link>
                  <Link href="/orders/history" className="block px-4 py-3 text-sm hover:bg-background">
                    📋 Order History
                  </Link>
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
                className="rounded-full border-2 border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 md:px-4"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-background md:hidden"
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
