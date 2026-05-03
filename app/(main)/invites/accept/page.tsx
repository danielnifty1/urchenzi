"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { getPostAuthRedirectPath } from "@/lib/auth/postAuthRedirect";
import type { UserSession } from "@/types";
import { refreshSession } from "@/services/authApi";
import {
  acceptStoreManagerInvite,
  acceptStoreManagerInviteSignup,
} from "@/services/storeManagerInvitesApi";
import { useUserStore } from "@/store/userStore";

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);
  const login = useUserStore((s) => s.login);
  const logout = useUserStore((s) => s.logout);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const returnToLogin = `/login?returnUrl=${encodeURIComponent(`/invites/accept?token=${encodeURIComponent(token)}`)}`;

  function redirectAfterInviteSession(session: UserSession) {
    if (!isProfileComplete(session)) {
      router.replace(profileCompletionPath("/dashboard", "store_manager"));
      return;
    }
    router.replace(getPostAuthRedirectPath(session));
  }

  const onAcceptLoggedIn = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await acceptStoreManagerInvite(token);
      const session = await refreshSession();
      login(session);
      toast.success("Invitation accepted. You can manage this store from your dashboard.");
      redirectAfterInviteSession(session);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }
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
      const session = await acceptStoreManagerInviteSignup({
        token,
        email: email.trim(),
        password,
      });
      login(session);
      toast.success("Account created. Welcome!");
      redirectAfterInviteSession(session);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!authResolved) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold text-foreground">Invalid invite</h1>
        <p className="text-sm text-muted">
          This link is missing a token. Open the full link from your invitation email or message.
        </p>
        <Link href="/login" className="inline-block text-sm font-semibold text-brand-strong hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store manager invitation</h1>
        <p className="mt-2 text-sm text-muted">
          Accept this invite to help run a storefront. You will only have access to the store you were
          invited to.
        </p>
      </div>

      {user ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-foreground">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
          <p className="text-sm text-muted">
            Your account email must match the invitation. If you use a different email, sign out and use the
            correct account or create one below.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAcceptLoggedIn()}
            className="w-full rounded-xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Accepting…" : "Accept invitation"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                await logout();
                router.push(returnToLogin);
              })();
            }}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            Use a different account
          </button>
        </div>
      ) : (
        <form onSubmit={onSignup} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Create your account</h2>
          <p className="text-sm text-muted">
            Use the same email the store owner invited. If you already have an account,{" "}
            <Link href={returnToLogin} className="font-semibold text-brand-strong hover:underline">
              sign in
            </Link>{" "}
            and return here to accept.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="invite-email">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand/30"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="invite-password">
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand/30"
              required
              minLength={8}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="invite-confirm"
            >
              Confirm password
            </label>
            <input
              id="invite-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand/30"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Create account and accept"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AcceptStoreManagerInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Loading…</div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
