"use client";

import { useState } from "react";
import Link from "next/link";
import { SavedAddresses } from "@/components/SavedAddresses";

export default function ProfilePage() {
  const [user] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl bg-brand p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">My Account</h1>
        <p className="text-sm sm:text-base text-white/80">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-4 sm:p-6 border border-border shadow-sm">
          <p className="text-xs sm:text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Name
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{user.name}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 sm:p-6 border border-border shadow-sm">
          <p className="text-xs sm:text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Email
          </p>
          <p className="text-xs sm:text-sm font-semibold text-foreground break-all">
            {user.email}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 sm:p-6 border border-border shadow-sm">
          <p className="text-xs sm:text-sm text-muted uppercase tracking-wide font-semibold mb-2">
            Phone
          </p>
          <p className="text-sm sm:text-lg font-semibold text-foreground">{user.phone}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-4 sm:p-8 border border-border">
        <SavedAddresses />
      </div>

      <div className="rounded-2xl bg-surface p-4 sm:p-8 border border-border">
        <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <Link
            href="/orders/history"
            className="rounded-lg border-2 border-brand p-3 sm:p-4 text-center font-semibold text-brand hover:bg-brand/10 transition text-sm sm:text-base"
          >
            📋 Order History
          </Link>
          <Link
            href="/promos"
            className="rounded-lg border-2 border-brand p-3 sm:p-4 text-center font-semibold text-brand hover:bg-brand/10 transition text-sm sm:text-base"
          >
            🎟️ Available Promos
          </Link>
          <button className="rounded-lg border-2 border-border p-3 sm:p-4 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition text-sm sm:text-base">
            ⚙️ Settings
          </button>
          <button className="rounded-lg border-2 border-error p-3 sm:p-4 text-center font-semibold text-error hover:bg-error/10 transition text-sm sm:text-base">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
