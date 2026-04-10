"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { needsEmailVerification } from "@/lib/auth/emailVerification";
import { getPostAuthRedirectPath } from "@/lib/auth/postAuthRedirect";
import { me, resendVerificationEmail } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

export default function VerifyEmailPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const login = useUserStore((s) => s.login);
  const logout = useUserStore((s) => s.logout);
  const authResolved = useUserStore((s) => s.authResolved);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authResolved) return;
    if (!user) {
      router.replace("/login?returnUrl=/verify-email");
      return;
    }
    if (!needsEmailVerification(user)) {
      router.replace(getPostAuthRedirectPath(user));
    }
  }, [authResolved, user, router]);

  const onResend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail(user.email);
      toast.success("Verification email sent.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onRecheck = async () => {
    setBusy(true);
    try {
      const session = await me();
      login(session);
      if (!needsEmailVerification(session)) {
        toast.success("Email verified.");
        router.replace(getPostAuthRedirectPath(session));
      } else {
        toast("Not verified yet. Check your inbox.", { icon: "✉️" });
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!authResolved || !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (!needsEmailVerification(user)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a verification link to <span className="font-mono text-foreground">{user.email}</span>.
          Open it to activate your account.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onResend()}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            Resend verification email
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRecheck()}
            className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-border/40 disabled:opacity-50"
          >
            I’ve verified — continue
          </button>
        </div>
        <p className="mt-6 text-xs text-muted">
          Wrong inbox?{" "}
          <button type="button" className="font-medium text-brand underline" onClick={() => void logout()}>
            Sign out
          </button>{" "}
          and sign in with another account.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="font-medium text-brand hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
