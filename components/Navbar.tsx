"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCartStore } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";

export const Navbar = () => {
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-brand-strong">
          Urchenzi<span className="text-brand">Connect</span>
        </Link>
        <div className="flex items-center gap-2 text-sm md:gap-3">
          <ThemeToggle />
          <Link href="/cart" className="rounded-full bg-brand-strong px-4 py-2 text-white">
            Cart ({count})
          </Link>
          {user ? (
            <button
              onClick={logout}
              className="rounded-full border border-border px-4 py-2 hover:bg-background"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="rounded-full border border-border px-4 py-2">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
