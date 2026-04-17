"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SavedAddresses } from "@/components/SavedAddresses";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { getMyProfile } from "@/services/profileApi";

export default function ProfilePage() {
  const profileQ = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });

  const user = profileQ.data;
  const displayName =
    [user?.firstName, user?.lastName].filter((x) => Boolean(x && x.trim())).join(" ").trim() ||
    user?.email ||
    "User";

  if (profileQ.isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-32 animate-pulse rounded-3xl bg-surface" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  if (profileQ.isError || !user) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <p className="font-semibold">Could not load profile</p>
        <p className="mt-2 text-sm opacity-90">{getApiErrorMessage(profileQ.error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-brand p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">My Account</h1>
        <p className="text-white/80">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Name
          </p>
          <p className="text-2xl font-bold text-foreground">{displayName}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Email
          </p>
          <p className="text-sm font-semibold text-foreground break-all">
            {user.email}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Phone
          </p>
          <p className="text-lg font-semibold text-foreground">{user.phone ?? "Not set"}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">Role</p>
          <p className="text-lg font-semibold text-foreground capitalize">{user.role || "unknown"}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">Status</p>
          <p className="text-lg font-semibold text-foreground capitalize">{user.status || "unknown"}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 border border-border shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wide font-semibold mb-2">Address</p>
          <p className="text-sm font-semibold text-foreground break-words">{user.address ?? "Not set"}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border">
        <SavedAddresses />
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/orders/history"
            className="rounded-lg border-2 border-brand p-4 text-center font-semibold text-brand hover:bg-brand/10 transition"
          >
            📋 Order History
          </Link>
          <Link
            href="/promos"
            className="rounded-lg border-2 border-brand p-4 text-center font-semibold text-brand hover:bg-brand/10 transition"
          >
            🎟️ Available Promos
          </Link>
          <button className="rounded-lg border-2 border-border p-4 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition">
            ⚙️ Settings
          </button>
          <button className="rounded-lg border-2 border-error p-4 text-center font-semibold text-error hover:bg-error/10 transition">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
