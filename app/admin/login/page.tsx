"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { NotAdminError } from "@/services/adminAuthApi";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in.");
    } catch (err) {
      if (err instanceof NotAdminError) {
        toast.error("Access denied. This account is not an administrator.");
      } else {
        toast.error(formatAdminError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Admin sign in</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Use an account with role <code className="text-emerald-400">admin</code> on the API.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600">
          <Link href="/" className="text-emerald-500 hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
