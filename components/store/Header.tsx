"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StoreHeaderProps = {
  locationLabel?: string;
};

export function Header({ locationLabel = "Obafemi Awolowo Way" }: StoreHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

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

        <div className="order-last flex w-full min-w-0 flex-1 items-center md:order-none md:max-w-xl md:justify-center">
          <label className="sr-only" htmlFor="store-search">
            Search products
          </label>
          <div className="flex w-full items-center rounded-full border border-border bg-background pl-4 shadow-sm">
            <span className="text-muted" aria-hidden>
              🔍
            </span>
            <input
              id="store-search"
              type="search"
              placeholder="Search products..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="button"
              className="mr-1 rounded-full bg-[#00A082] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Search
            </button>
          </div>
        </div>

        <Link
          href="/login"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full border-2 border-[#00A082] px-4 py-2 text-sm font-semibold text-[#00A082] transition hover:bg-[#00A082]/10"
        >
          <span aria-hidden>👤</span>
          Login
        </Link>
      </div>
    </header>
  );
}
