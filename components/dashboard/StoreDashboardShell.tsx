"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useUserStore } from "@/store/userStore";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";

const STORE_BASE = "/dashboard/stores";

function href(storeId: string, path: string) {
  return `${STORE_BASE}/${storeId}${path}`;
}

const TABS = [
  { path: "", label: "Overview" },
  { path: "/products", label: "Products" },
  { path: "/orders", label: "Orders" },
  { path: "/analytics", label: "Analytics" },
  { path: "/settings", label: "Settings" },
] as const;

export function StoreDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { storeId } = useStoreDashboard();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const storesQ = useQuery({
    queryKey: ["dashboard-accessible-stores"],
    queryFn: () => fetchMyAccessibleStores(),
    staleTime: 120_000,
  });

  const currentStore = storesQ.data?.find((s) => s.id === storeId);

  function tabActive(path: string) {
    const full = href(storeId, path);
    if (path === "") {
      return pathname === full || pathname === `${full}/`;
    }
    return pathname.startsWith(full);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1419] text-white">
      <EmailVerificationBanner />
      <div className="flex min-h-0 w-full flex-1">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-[#0b0f14] transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="text-2xl">🏪</span>
          <div className="min-w-0">
            <Link href="/dashboard" className="block text-sm font-bold tracking-tight hover:text-emerald-300">
              Vendor dashboard
            </Link>
            <div className="truncate text-xs text-white/50">Multi-store</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="mb-2 block rounded-xl px-3 py-2 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
          >
            ← Global overview
          </Link>
          <Link
            href="/dashboard/stores"
            onClick={() => setMobileOpen(false)}
            className="mb-3 block rounded-xl px-3 py-2 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
          >
            All stores
          </Link>
          {TABS.map((item) => {
            const to = href(storeId, item.path);
            const active = tabActive(item.path);
            return (
              <Link
                key={item.path || "overview"}
                href={to}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[#00A082] text-white shadow-lg shadow-[#00A082]/25"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="mb-3 truncate text-xs text-white/50">{user?.email}</div>
          <Link
            href="/vendor/dashboard"
            className="mb-2 block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Legacy vendor hub
          </Link>
          <Link href="/" className="mb-2 block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            Storefront
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
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1419]/90 backdrop-blur-md">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                {currentStore?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentStore.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">🏪</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold text-white md:text-xl">
                  {currentStore?.name ?? "Store workspace"}
                </h1>
                <p className="truncate font-mono text-[11px] text-white/45">{storeId}</p>
              </div>
              <Link
                href={href(storeId, "/settings")}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                Edit store
              </Link>
            </div>
            {storesQ.data && storesQ.data.length > 1 ? (
              <label className="flex items-center gap-2 text-xs text-white/60">
                <span className="hidden sm:inline">Switch</span>
                <select
                  value={storeId}
                  onChange={(e) => {
                    const next = e.target.value;
                    const prefix = `${STORE_BASE}/${storeId}`;
                    const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
                    router.push(`${STORE_BASE}/${next}${rest}`);
                  }}
                  className="max-w-[200px] rounded-lg border border-white/15 bg-[#0b0f14] px-2 py-1.5 text-sm text-white"
                >
                  {storesQ.data.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
            {TABS.map((item) => {
              const to = href(storeId, item.path);
              const active = tabActive(item.path);
              return (
                <Link
                  key={item.path || "ov"}
                  href={to}
                  className={clsx(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 bg-[#f4f6f8] p-4 text-foreground dark:bg-[#0f1419] md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      </div>
    </div>
  );
}
