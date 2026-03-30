"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function RegisterPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const confirmError = useMemo(() => {
    if (!confirmPassword) return null;
    return confirmPassword === password ? null : "Passwords do not match.";
  }, [confirmPassword, password]);

  const canSubmit = Boolean(
    name.trim() && email && password && confirmPassword && !emailError && !passwordError && !confirmError && !isSubmitting,
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const session = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      login(session);
      toast.success("Your account is ready.");
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create your account right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      <aside className="rounded-3xl bg-surface border border-border p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Create account</p>
        <h1 className="mt-4 text-3xl font-bold text-foreground leading-tight">
          Join UrchenziConnect in under a minute.
        </h1>
        <p className="mt-4 text-sm text-muted">
          Save addresses, reorder faster, and track every delivery in real time.
        </p>
        <div className="mt-8 rounded-2xl bg-background p-4 text-sm text-foreground">
          <p className="font-semibold">What you get instantly:</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li>• Personalized vendor recommendations</li>
            <li>• One-click checkout with saved details</li>
            <li>• Order history and delivery updates</li>
          </ul>
        </div>
      </aside>

      <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted">Authentication is now powered by your external API.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Full name
            </label>
            <input
              id="fullName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className={inputClassName}
              required
            />
          </div>

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
              placeholder="jane@example.com"
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={inputClassName}
              required
              minLength={8}
            />
            {passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className={inputClassName}
              required
            />
            {confirmError && <p className="mt-1 text-xs text-error">{confirmError}</p>}
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
