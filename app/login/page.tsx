"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { loginWithPassword, registerWithPassword, googleAuthRedirectUrl } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onGoogle = () => {
    window.location.href = googleAuthRedirectUrl();
  };

  const onEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
    }

    setBusy(true);
    try {
      const session =
        mode === "signin"
          ? await loginWithPassword(email.trim(), password)
          : await registerWithPassword({
              email: email.trim(),
              password,
              // role: "customer",
            });
      login(session);
      toast.success(mode === "signin" ? "Welcome back." : "Account created.");
      router.push("/");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="mt-1 text-sm text-muted">Sign in or create an account to continue.</p>

        <div className="mt-6 flex rounded-full border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === "signin" ? "bg-brand-strong text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-brand-strong text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background py-3 text-sm font-semibold text-foreground transition hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted">or with email</span>
          </div>
        </div>

        <form onSubmit={onEmailSubmit} className="space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-brand-strong/30 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-brand-strong/30 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />
          {mode === "signup" && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-brand-strong/30 focus:ring-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-strong py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-brand-strong">
              Sign up
            </button>
            {" · "}
            <Link href="/register" className="font-semibold text-brand-strong">
              Full registration form
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => setMode("signin")} className="font-semibold text-brand-strong">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
