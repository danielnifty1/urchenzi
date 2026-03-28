"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useUserStore } from "@/store/userStore";

type Mode = "signin" | "signup";

function googleAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Pop-up was blocked. Allow pop-ups for this site.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method.";
    default:
      return "Google sign-in failed. Try again.";
  }
}

function emailAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Switch to Sign in.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Something went wrong. Try again.";
  }
}

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

  const firebaseReady = isFirebaseConfigured();

  const onGoogle = async () => {
    if (!firebaseReady) {
      toast.error("Add Firebase keys to .env.local to enable Google sign-in.");
      return;
    }
    setBusy(true);
    try {
      const session = await signInWithGoogle();
      login(session);
      toast.success(
        mode === "signup" ? "Account created with Google." : "Signed in with Google.",
      );
      router.push("/");
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      toast.error(googleAuthErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  const onEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    if (firebaseReady) {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }
      }
      setBusy(true);
      try {
        const session =
          mode === "signin"
            ? await signInWithEmail(email.trim(), password)
            : await signUpWithEmail(email.trim(), password);
        login(session);
        toast.success(mode === "signin" ? "Welcome back." : "Account created.");
        router.push("/");
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
        toast.error(emailAuthErrorMessage(code));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === "signup") {
      toast.error("Email sign-up requires Firebase. Configure .env.local or use demo sign-in.");
      return;
    }
    login({ id: "demo", name: "Demo User", email: email.trim() });
    toast.success("Welcome (demo mode — add Firebase for real auth).");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="mt-1 text-sm text-muted">Sign in or create an account to continue.</p>

        {!firebaseReady && (
          <p className="mt-4 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-foreground">
            Firebase is not configured. Google sign-in is disabled. Email sign-in uses a{" "}
            <strong>demo</strong> session only. Copy{" "}
            <code className="rounded bg-background px-1">env.example</code> to{" "}
            <code className="rounded bg-background px-1">.env.local</code> and add your web app keys
            from the Firebase console (Authentication → Sign-in method → Google).
          </p>
        )}

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
          disabled={busy || !firebaseReady}
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
            minLength={firebaseReady && mode === "signup" ? 6 : undefined}
          />
          {mode === "signup" && firebaseReady && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-brand-strong/30 focus:ring-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
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
