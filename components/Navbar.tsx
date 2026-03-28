"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocationSelector } from "@/components/LocationSelector";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";

export const Navbar = () => {
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <div className="font-black text-brand text-2xl">U</div>
              <div className="font-black text-accent text-2xl">C</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold tracking-wider text-foreground">
                URCHENZI CONNECT
              </div>
              <div className="text-xs text-muted font-medium">Your Community, Connected</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-brand transition">
              Home
            </Link>
            <Link href="/promos" className="text-sm font-medium text-foreground hover:text-brand transition">
              Promos
            </Link>
            <Link href="/orders/history" className="text-sm font-medium text-foreground hover:text-brand transition">
              Orders
            </Link>
          </div>

          <div className="hidden lg:block">
            <LocationSelector />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />

            <Link
              href="/cart"
              className="relative rounded-lg bg-brand px-3 md:px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              🛒
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group hidden sm:block">
                <button className="rounded-full border-2 border-brand px-3 md:px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/5 transition">
                  👤 {user.name.split(" ")[0]}
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-sm hover:bg-background"
                  >
                    👤 Profile
                  </Link>
                  <Link
                    href="/orders/history"
                    className="block px-4 py-3 text-sm hover:bg-background"
                  >
                    📋 Order History
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-background text-error"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full border-2 border-brand px-3 md:px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/5 transition"
              >
                Login
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-background rounded-lg"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 space-y-2 border-t border-border pt-3">
            <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-background text-sm font-medium">
              Home
            </Link>
            <Link href="/promos" className="block px-3 py-2 rounded-lg hover:bg-background text-sm font-medium">
              Promos
            </Link>
            <Link href="/orders/history" className="block px-3 py-2 rounded-lg hover:bg-background text-sm font-medium">
              Orders
            </Link>
            {user && (
              <Link href="/profile" className="block px-3 py-2 rounded-lg hover:bg-background text-sm font-medium">
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
