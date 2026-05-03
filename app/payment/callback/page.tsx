"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorStateRetry } from "@/components/ErrorStateRetry";
import { StatusBadge } from "@/components/StatusBadge";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { verifyPaymentCallback } from "@/services/paymentApi";

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 translate-y-1/4 rounded-full bg-[color-mix(in_srgb,var(--brand)_22%,transparent)] blur-3xl motion-safe:animate-pulse motion-reduce:animate-none"
        style={{ animationDelay: "0.6s" }}
      />
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
    </div>
  );
}

function VerifyingAnimation() {
  return (
    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full border-2 border-brand/20 dark:border-brand/30"
      />
      <div
        aria-hidden
        className="absolute inset-1 rounded-full border-2 border-transparent border-t-brand border-r-brand/40 motion-safe:animate-spin"
        style={{ animationDuration: "1.15s" }}
      />
      <div
        aria-hidden
        className="absolute inset-4 rounded-full border-2 border-transparent border-b-accent/80 border-l-accent/30 motion-safe:animate-spin"
        style={{ animationDuration: "2.4s", animationDirection: "reverse" }}
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/25">
        <svg
          className="h-7 w-7 text-white motion-safe:animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>
    </div>
  );
}

function ShimmerLine() {
  return (
    <div className="relative mx-auto mt-6 h-1 w-3/4 max-w-[200px] overflow-hidden rounded-full bg-border/80">
      <div className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-brand/55 to-transparent motion-safe:animate-[payment-callback-shimmer_1.8s_ease-in-out_infinite] motion-reduce:animate-none dark:via-brand/70" />
    </div>
  );
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [fallbackReference, setFallbackReference] = useState("");
  const reference = String(params.get("reference") ?? params.get("trxref") ?? fallbackReference).trim();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params.get("reference") || params.get("trxref")) return;
    const cached = window.sessionStorage.getItem("last_payment_reference") ?? "";
    if (cached.trim()) {
      setFallbackReference(cached.trim());
    }
  }, [params]);

  const callbackQ = useQuery({
    queryKey: ["payment-callback-verify", reference],
    enabled: Boolean(reference),
    queryFn: ({ signal }) => verifyPaymentCallback(reference, signal),
  });
  const orderId = callbackQ.data?.orderId || undefined;
  const statusQ = usePaymentStatus(orderId, Boolean(orderId && !callbackQ.isLoading));

  const resolvedPaid = useMemo(() => {
    if (statusQ.data?.isPaid) return true;
    return Boolean(callbackQ.data?.isPaid);
  }, [callbackQ.data?.isPaid, statusQ.data?.isPaid]);

  useEffect(() => {
    if (!orderId) return;
    if (statusQ.isLoading || statusQ.isFetching) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("last_payment_reference");
    }
    const t = setTimeout(() => {
      router.replace(`/order/${encodeURIComponent(orderId)}`);
    }, 2500);
    return () => clearTimeout(t);
  }, [orderId, router, statusQ.isFetching, statusQ.isLoading, resolvedPaid]);

  if (!reference) {
    return (
      <CallbackShell>
        <div className="motion-safe:animate-[payment-callback-fade-in_0.45s_ease-out_both] rounded-3xl border border-border/80 bg-surface/90 p-8 text-center shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/30">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error/15 text-error">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-foreground">Missing payment reference</h1>
          <p className="mt-2 text-sm text-muted">
            Open this page from the payment return link, or complete checkout again from your order.
          </p>
          <Link
            href="/orders/history"
            className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Order history
          </Link>
        </div>
      </CallbackShell>
    );
  }

  if (callbackQ.isLoading) {
    return (
      <CallbackShell>
        <div className="rounded-3xl border border-border/80 bg-surface/90 p-10 text-center shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/30 motion-safe:animate-[payment-callback-fade-in_0.45s_ease-out_both]">
          <VerifyingAnimation />
          <h1 className="mt-8 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Verifying payment</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Securely confirming your transaction with our payment partner. This usually takes a few seconds.
          </p>
          <ShimmerLine />
          <p className="mt-6 truncate font-mono text-[11px] text-muted/90" title={reference}>
            Ref · {reference}
          </p>
        </div>
      </CallbackShell>
    );
  }

  if (callbackQ.isError) {
    return (
      <CallbackShell>
        <div className="motion-safe:animate-[payment-callback-fade-in_0.45s_ease-out_both] overflow-hidden rounded-3xl border border-border/80 bg-surface/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/30">
          <div className="border-b border-border/60 bg-gradient-to-r from-error/12 to-error/5 px-6 py-5">
            <h1 className="text-lg font-bold text-foreground">Verification failed</h1>
            <p className="mt-1 text-sm text-muted">We could not confirm this payment right now.</p>
          </div>
          <div className="p-6">
            <ErrorStateRetry message={getApiErrorMessage(callbackQ.error)} onRetry={() => callbackQ.refetch()} />
          </div>
        </div>
      </CallbackShell>
    );
  }

  const finalStatus = statusQ.data?.paymentStatus ?? callbackQ.data?.paymentStatus ?? "pending";
  const isPolling = Boolean(orderId) && !resolvedPaid && (statusQ.isFetching || statusQ.isLoading);

  return (
    <CallbackShell>
      <div
        className={clsx(
          "overflow-hidden rounded-3xl border bg-surface/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/30 motion-safe:animate-[payment-callback-fade-in_0.5s_ease-out_both]",
          resolvedPaid
            ? "border-success/40 ring-1 ring-success/25"
            : "border-border/80 ring-1 ring-transparent",
        )}
      >
        <div
          className={clsx(
            "relative px-6 pb-6 pt-8",
            resolvedPaid
              ? "bg-gradient-to-b from-success/14 via-transparent to-transparent"
              : "bg-gradient-to-b from-brand/12 via-transparent to-transparent dark:from-brand/22",
          )}
        >
          {resolvedPaid ? (
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success motion-safe:animate-[payment-callback-scale-in_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]"
              aria-hidden
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto mb-5 flex justify-center">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-brand/25" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand motion-safe:animate-spin"
                  style={{ animationDuration: "0.9s" }}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {resolvedPaid ? "Payment confirmed" : "Confirming payment"}
              </h1>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
                {resolvedPaid
                  ? "Your payment was verified. Redirecting you to your order…"
                  : "We are checking with the payment provider. You can stay on this page — we will update automatically."}
              </p>
            </div>
            <StatusBadge value={finalStatus} kind="payment" />
          </div>
          {isPolling ? (
            <div className="mt-5 flex items-center justify-center gap-1.5 sm:justify-start" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-brand/50 motion-safe:animate-pulse dark:bg-brand/70"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
              <span className="ml-2 text-xs font-medium text-muted">Checking status…</span>
            </div>
          ) : null}
        </div>
        <div className="border-t border-border/60 bg-background/40 px-6 py-5 dark:bg-background/20">
          <p className="truncate font-mono text-[11px] text-muted" title={reference}>
            Reference · {reference}
          </p>
          {orderId ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/order/${encodeURIComponent(orderId)}`}
                className="inline-flex min-w-[140px] flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark sm:flex-none"
              >
                View order
              </Link>
              <button
                type="button"
                onClick={() => statusQ.refetch()}
                className="inline-flex min-w-[120px] flex-1 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-background sm:flex-none"
              >
                Refresh status
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </CallbackShell>
  );
}
