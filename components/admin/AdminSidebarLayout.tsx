"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

function IconDashboard(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconFolder(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconShield(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconStore(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconEye(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconSettings(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconSparkles(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
    </svg>
  );
}

function IconPackage(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconImage(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconMenu(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const iconClass = "h-5 w-5 shrink-0 opacity-90";

function SidebarLink({
  href,
  active,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function vendorNav(vendorId: string) {
  const base = `/admin/${vendorId}`;
  return [
    { href: base, label: "Overview", icon: <IconEye className={iconClass} /> },
    { href: `${base}/settings`, label: "Settings", icon: <IconSettings className={iconClass} /> },
    { href: `${base}/features`, label: "Features", icon: <IconSparkles className={iconClass} /> },
    { href: `${base}/products`, label: "Products", icon: <IconPackage className={iconClass} /> },
    { href: `${base}/media`, label: "Media", icon: <IconImage className={iconClass} /> },
  ] as const;
}

function shortVendorId(id: string) {
  if (id.length <= 13) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function AdminSidebarLayout({
  children,
  vendorId,
}: {
  children: React.ReactNode;
  vendorId?: string | null;
}) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const dash = pathname === "/admin" || pathname === "/admin/";
  const vendorEntry = pathname === "/admin/vendor" || pathname.startsWith("/admin/vendor/");
  const rbacEntry = pathname === "/admin/rbac" || pathname.startsWith("/admin/rbac/");

  const baseVendor = vendorId ? `/admin/${vendorId}` : "";

  const sidebarBody = (
    <>
      <div className="hidden shrink-0 md:block md:pb-6">
        <Link
          href="/admin"
          onClick={closeMobile}
          className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight text-white"
        >
          Urchenzi<span className="text-emerald-500">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 md:px-2">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Platform</p>
        <SidebarLink
          href="/admin"
          active={dash}
          icon={<IconDashboard className={iconClass} />}
          label="Dashboard"
          onNavigate={closeMobile}
        />
        <SidebarLink
          href="/admin/vendor"
          active={vendorEntry && !vendorId}
          icon={<IconFolder className={iconClass} />}
          label="Directory"
          onNavigate={closeMobile}
        />

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Admin</p>
        <SidebarLink
          href="/admin/rbac"
          active={rbacEntry && !vendorId}
          icon={<IconShield className={iconClass} />}
          label="Role assignments"
          onNavigate={closeMobile}
        />

        {vendorId ? (
          <>
            <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Store
            </p>
            <div className="mb-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <IconStore className="h-4 w-4 shrink-0 text-emerald-500/80" />
                <span className="font-medium text-zinc-400">Vendor</span>
              </div>
              <code className="mt-1 block truncate text-[11px] text-zinc-500" title={vendorId}>
                {shortVendorId(vendorId)}
              </code>
            </div>
            {vendorNav(vendorId).map(({ href, label, icon }) => {
              const on =
                href === baseVendor
                  ? pathname === href || pathname === `${baseVendor}/`
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <SidebarLink
                  key={href}
                  href={href}
                  active={on}
                  icon={icon}
                  label={label}
                  onNavigate={closeMobile}
                />
              );
            })}
          </>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-zinc-800/80 p-3">
        <p className="truncate px-1 text-xs text-zinc-500" title={user?.email ?? undefined}>
          {user?.email}
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 w-full rounded-xl border border-zinc-700/80 bg-zinc-900/40 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"
        >
          <IconMenu className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold text-white">
          Urchenzi<span className="text-emerald-500">Admin</span>
        </span>
        <span className="w-10" aria-hidden />
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <div className="flex min-h-screen pt-14 md:pt-0">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/40 transition-transform duration-200 ease-out md:static md:z-0 md:translate-x-0 md:shadow-none ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-zinc-800/80 px-2 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 pt-2 md:pt-6">{sidebarBody}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
