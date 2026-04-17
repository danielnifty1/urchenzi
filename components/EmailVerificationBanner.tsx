"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { needsEmailVerification } from "@/lib/auth/emailVerification";
import { me, resendVerificationEmail } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";
import clsx from "clsx";

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type BannerProps = {
  /** e.g. pin under a dark dashboard chrome */
  className?: string;
};

export function EmailVerificationBanner({ className }: BannerProps) {
  const user = useUserStore((s) => s.user);
  const login = useUserStore((s) => s.login);
  const [busy, setBusy] = useState(false);

  if (!user || !needsEmailVerification(user)) {
    return null;
  }

  const onResend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail(user.email);
      toast.success("Verification email sent. Check your inbox.");
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
        toast.success("Email verified. You’re all set.");
        window.location.reload();
      } else {
        toast("Still waiting for verification.", { icon: "✉️" });
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="status"
      className={clsx(
        "w-full shrink-0 border-b border-sky-200/90 bg-[#e8f4fc] text-[#1a1a1a] dark:border-sky-800/60 dark:bg-sky-950/85 dark:text-sky-50",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-4">
        <div className="relative overflow-hidden rounded-b-[22px] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50 px-3 py-2.5 shadow-[0_10px_25px_rgba(56,189,248,0.16)] dark:border-sky-800/70 dark:from-sky-950/70 dark:via-sky-950/40 dark:to-sky-950/70 sm:px-4">
          <div className="pointer-events-none absolute -left-8 top-0 h-16 w-16 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-600/20" />
          <div className="pointer-events-none absolute -right-6 bottom-0 h-14 w-14 rounded-full bg-cyan-200/50 blur-2xl dark:bg-cyan-500/20" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-300 sm:mt-0" />
          <p className="text-sm leading-snug text-[#1a1a1a] dark:text-sky-100">
            <span className="mr-2 inline-flex items-center rounded-full border border-sky-300 bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:border-sky-700 dark:bg-sky-900/80 dark:text-sky-100">
              Verify Email
            </span>
            <span className="font-semibold">Please activate your account</span> to use UrchenziConnect.
            We sent a verification email to{" "}
            <span className="break-all font-semibold">{user.email}</span>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onResend()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Resend verification
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRecheck()}
            className="text-sm font-medium text-sky-800 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-950 disabled:opacity-50 dark:text-sky-200 dark:hover:text-white"
          >
            I’ve verified
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
