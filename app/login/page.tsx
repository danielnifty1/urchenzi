"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function LoginPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Enter a valid email address.";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return null;
    return password.length >= 8 ? null : "Password must be at least 8 characters.";
  }, [password]);

  const canSubmit = Boolean(email && password && !emailError && !passwordError && !isSubmitting);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const session = await authApi.login({
        email: email.trim(),
        password,
      });
      login(session);
      toast.success(`Welcome back, ${session.name.split(" ")[0]}!`);
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      <aside className="rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">UrchenziConnect</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight">Sign in to continue your delivery journey.</h1>
        <p className="mt-4 text-sm text-white/80">
          Fast checkout, saved addresses, and real-time delivery updates—all in one place.
        </p>
        <div className="mt-8 space-y-3 rounded-2xl bg-white/10 p-4 text-sm">
          <p>• Secure session handled by external API authentication.</p>
          <p>• Contact your backend team for API credentials and auth endpoint setup.</p>
        </div>
      </aside>

      <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">Enter your credentials to access your account.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClassName}
              required
            />
            {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className={inputClassName}
              required
            />
            {passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}
          </div>

          {formError && (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
