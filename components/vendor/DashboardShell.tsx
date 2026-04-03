"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import clsx from "clsx";

const NAV = [
  { href: "/vendor/dashboard", label: "Overview", icon: "📊" },
  { href: "/vendor/dashboard/products", label: "Products", icon: "🍽️" },
  { href: "/vendor/dashboard/features", label: "Features", icon: "⚡" },
  { href: "/vendor/dashboard/settings", label: "Store settings", icon: "⚙️" },
] as const;

function navMatch(pathname: string, href: string) {
  if (href === "/vendor/dashboard") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname.startsWith(href);
}

const NAV_BY_SPECIFICITY = [...NAV].sort((a, b) => b.href.length - a.href.length);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0f1419] text-white">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-[#0b0f14] transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="text-2xl">🏪</span>
          <div>
            <div className="text-sm font-bold tracking-tight">Vendor Hub</div>
            <div className="truncate text-xs text-white/50">UrchenziConnect</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = navMatch(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[#00A082] text-white shadow-lg shadow-[#00A082]/25"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="mb-3 truncate text-xs text-white/50">{user?.email}</div>
          <Link
            href="/"
            className="mb-2 block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            ← View storefront
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
          >
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-[#0f1419]/90 px-4 backdrop-blur-md md:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-white md:text-xl">
              {NAV_BY_SPECIFICITY.find((n) => navMatch(pathname, n.href))?.label ??
                "Dashboard"}
            </h1>
            <p className="truncate text-xs text-white/45">
              Manage your store, menu, and customer experience
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#00A082]/20 px-3 py-1.5 text-xs font-medium text-[#7dffc8] sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live
          </div>
        </header>

        <main className="flex-1 bg-[#f4f6f8] p-4 text-foreground dark:bg-[#0f1419] md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
