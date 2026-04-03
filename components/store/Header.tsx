"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserStore } from "@/store/userStore";

type StoreHeaderProps = {
  locationLabel?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchDisabled?: boolean;
};

export function Header({
  locationLabel = "Obafemi Awolowo Way",
  searchQuery,
  onSearchChange,
  searchDisabled = false,
}: StoreHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const user = useUserStore((state) => state.user);
  const authResolved = useUserStore((state) => state.authResolved);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm transition-shadow ${
        scrolled ? "shadow-md" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <Link href="/" className="shrink-0 text-xl font-black text-[#00A082]">
          Urchenzi<span className="text-foreground">Connect</span>
        </Link>

        <button
          type="button"
          className="flex max-w-[200px] items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground md:max-w-[240px]"
        >
          <span aria-hidden>📍</span>
          <span className="truncate">{locationLabel}</span>
          <span className="text-muted">▼</span>
        </button>

        <form
          className="order-last flex w-full min-w-0 flex-1 items-center md:order-none md:max-w-xl md:justify-center"
          role="search"
          aria-label="Search this store"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label className="sr-only" htmlFor="store-search">
            Search products in this store
          </label>
          <div
            className={`flex w-full items-center rounded-full border border-border bg-background pl-4 shadow-sm ${
              searchDisabled ? "opacity-60" : ""
            }`}
          >
            <span className="text-muted" aria-hidden>
              🔍
            </span>
            <input
              id="store-search"
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={searchDisabled}
              placeholder="Search products..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed"
            />
            {searchQuery ? (
              <button
                type="button"
                className="mr-1 rounded-full px-2 py-2 text-sm text-muted hover:text-foreground"
                aria-label="Clear search"
                onClick={() => onSearchChange("")}
              >
                ✕
              </button>
            ) : null}
            <button
              type="submit"
              className="mr-1 rounded-full bg-[#00A082] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={searchDisabled}
            >
              Search
            </button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle variant="default" />
          {!authResolved ? (
            <div className="h-10 w-20 animate-pulse rounded-full bg-background" aria-hidden />
          ) : user ? (
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border-2 border-[#00A082] px-3 py-2 text-sm font-semibold text-[#00A082] transition hover:bg-[#00A082]/10 md:px-4"
              >
                <span aria-hidden>👤</span>
                <span className="max-w-[8rem] truncate">{user.name.split(" ")[0]}</span>
              </button>
              <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border border-border bg-surface opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-background">
                  Profile
                </Link>
                <Link href="/orders/history" className="block px-4 py-3 text-sm hover:bg-background">
                  Order history
                </Link>
                {user.role === "vendor" && (
                  <Link href="/vendor/dashboard" className="block px-4 py-3 text-sm hover:bg-background">
                    Vendor dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full px-4 py-3 text-left text-sm text-error hover:bg-background"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border-2 border-[#00A082] px-3 py-2 text-sm font-semibold text-[#00A082] transition hover:bg-[#00A082]/10 md:px-4"
            >
              <span aria-hidden>👤</span>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
