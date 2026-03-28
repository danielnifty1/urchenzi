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
          <p className="text-2xl font-bold text-foreground">{user.name}</p>
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
          <p className="text-lg font-semibold text-foreground">{user.phone}</p>
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
