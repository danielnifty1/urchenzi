"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ACTIVE_STORE_STORAGE_KEY, setActiveStoreId } from "@/lib/store/activeStoreId";
import { listMyStores } from "@/services/vendorStoresApi";
import { useUserStore } from "@/store/userStore";
import clsx from "clsx";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

const NAV = [
  { href: "/vendor/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard", label: "All stores", icon: "🏪" },
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

function withStoreQuery(href: string, storeId: string): string {
  if (!storeId) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}storeId=${encodeURIComponent(storeId)}`;
}

const NAV_BY_SPECIFICITY = [...NAV].sort((a, b) => b.href.length - a.href.length);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const storesQ = useQuery({
    queryKey: ["vendor-my-stores", "header-selector"],
    queryFn: listMyStores,
    staleTime: 60_000,
  });
  const stores = (storesQ.data ?? []).filter((s) => s.status === "active" || s.status === "draft");

  useEffect(() => {
    const sid = (searchParams.get("storeId") ?? "").trim();
    if (sid) {
      setSelectedStoreId(sid);
      return;
    }
    try {
      const stored = localStorage.getItem(ACTIVE_STORE_STORAGE_KEY) ?? "";
      setSelectedStoreId(stored);
    } catch {
      setSelectedStoreId("");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pathname.startsWith("/vendor/dashboard")) return;
    const hasQueryStore = (searchParams.get("storeId") ?? "").trim() !== "";
    if (hasQueryStore || !selectedStoreId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("storeId", selectedStoreId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, selectedStoreId]);

  return (
    <div className="flex min-h-screen w-screen flex-col bg-[#0f1419] text-white">
      <EmailVerificationBanner />
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 w-full flex-1">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-white/10 bg-[#0b0f14] shadow-2xl shadow-black/40 transition-transform duration-200 ease-out lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-end border-b border-white/10 px-2 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
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
                href={withStoreQuery(item.href, selectedStoreId)}
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="fixed left-0 right-0 top-0 z-[80] flex h-16 items-center gap-4 border-b border-white/10 bg-[#0f1419]/95 px-3 backdrop-blur-md md:px-4 lg:sticky lg:bg-[#0f1419]/90">
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
          {stores.length > 1 ? (
            <label className="min-w-[140px] sm:min-w-[190px]">
              <span className="sr-only">Active store</span>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const id = e.target.value || "";
                  setSelectedStoreId(id);
                  setActiveStoreId(id || null);
                  try {
                    if (id) localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, id);
                    else localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
                  } catch {
                    /* ignore */
                  }
                  const params = new URLSearchParams(searchParams.toString());
                  if (id) params.set("storeId", id);
                  else params.delete("storeId");
                  router.replace(`${pathname}?${params.toString()}`);
                }}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-2.5 py-2 text-xs text-white outline-none transition focus:border-[#00A082] sm:px-3"
              >
                <option value="">Choose store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id} className="bg-[#0f1419] text-white">
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="hidden items-center gap-2 rounded-full bg-[#00A082]/20 px-3 py-1.5 text-xs font-medium text-[#7dffc8] sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live
          </div>
        </header>

        <main className="w-full flex-1 bg-[#f4f6f8] pb-0 pt-20 text-foreground dark:bg-[#0f1419] lg:pt-16">
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}
