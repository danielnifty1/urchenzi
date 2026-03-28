"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useUserStore } from "@/store/userStore";

function googleAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Pop-up was blocked. Allow pop-ups for this site.";
    default:
      return "Google sign-in failed. Try again.";
  }
}

function emailAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Sign in on the login page.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    default:
      return "Something went wrong. Try again.";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const firebaseReady = isFirebaseConfigured();

  const onGoogle = async () => {
    if (!firebaseReady) {
      toast.error("Configure Firebase in .env.local to use Google.");
      return;
    }
    setBusy(true);
    try {
      const session = await signInWithGoogle();
      login(session);
      toast.success("Signed in with Google.");
      router.push("/");
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      toast.error(googleAuthErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (firebaseReady) {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      setBusy(true);
      try {
        const session = await signUpWithEmail(email.trim(), password);
        login({
          ...session,
          name: name.trim() || session.name,
        });
        toast.success("Account created.");
        router.push("/");
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
        toast.error(emailAuthErrorMessage(code));
      } finally {
        setBusy(false);
      }
      return;
    }
    login({ id: "u1", name: name.trim(), email: email.trim() });
    toast.success("Account created (demo — add Firebase for production auth).");
    router.push("/");
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
          disabled={busy || !firebaseReady}
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
          minLength={firebaseReady ? 6 : undefined}
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={firebaseReady ? 6 : undefined}
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
