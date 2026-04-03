"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { registerWithPassword, googleAuthRedirectUrl } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

function splitFullName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  if (!t) return { firstName: "", lastName: "" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default function RegisterPage() {
  const login = useUserStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onGoogle = () => {
    window.location.href = googleAuthRedirectUrl();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { firstName, lastName } = splitFullName(name);
      const session = await registerWithPassword({
        email: email.trim(),
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role: "customer",
      });
      login({ ...session, name: name.trim() });
      toast.success("Account created.");
      window.location.assign("/");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
        <h1 className="text-2xl font-bold">Register</h1>
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-strong">
            Sign in
          </Link>
        </p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="w-full rounded-full border border-border bg-background py-3 text-sm font-semibold disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted">or email</span>
          </div>
        </div>

        <input
          placeholder="Full name"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-strong py-2 font-medium text-white disabled:opacity-50"
        >
          {busy ? "Please wait…" : "Register"}
        </button>
      </form>
    </div>
  );
}
