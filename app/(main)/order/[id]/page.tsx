"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { DeliveryTimeline } from "@/components/DeliveryTimeline";
import { ErrorStateRetry } from "@/components/ErrorStateRetry";
import { RiderCard } from "@/components/RiderCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { useInitializePayment } from "@/hooks/useInitializePayment";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { getCustomerOrder } from "@/services/customerOrdersApi";
import { playNotificationSound } from "@/lib/sounds/playNotificationSound";
import { formatCurrency } from "@/utils/format";

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const orderRef = typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ["customer-order", orderRef],
    queryFn: () => getCustomerOrder(orderRef),
    enabled: Boolean(orderRef),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 4000;
      const step = d.tracking.step;
      if (step === "delivered" || step === "cancelled" || step === "delivery_failed") return false;
      const st = d.status?.toLowerCase() ?? "";
      if (
        st === "delivered" ||
        st === "cancelled" ||
        st === "canceled" ||
        st === "delivery_failed"
      ) {
        return false;
      }
      return 4000;
    },
  });
  const initializePayMut = useInitializePayment();
  const paymentStatusQ = usePaymentStatus(order?.id, Boolean(order?.id));

  const routeKeyRef = useRef<string | null>(null);
  const prevOrderSnapshot = useRef<{ status: string; step: string } | null>(null);
  useEffect(() => {
    if (!order) return;
    const snap = {
      status: order.status.toLowerCase(),
      step: order.tracking.step,
    };
    if (routeKeyRef.current !== orderRef) {
      routeKeyRef.current = orderRef;
      prevOrderSnapshot.current = snap;
      return;
    }
    const prev = prevOrderSnapshot.current;
    if (prev && (prev.status !== snap.status || prev.step !== snap.step)) {
      playNotificationSound("status");
    }
    prevOrderSnapshot.current = snap;
  }, [order, orderRef]);

  const estimatedLabel =
    order?.tracking.estimatedDeliveryMinutes != null
      ? `About ${order.tracking.estimatedDeliveryMinutes} min`
      : undefined;

  const isDelivered =
    order?.tracking.step === "delivered" ||
    order?.status?.toLowerCase() === "delivered";

  const isTerminal =
    order?.tracking.step === "cancelled" ||
    order?.tracking.step === "delivery_failed" ||
    ["cancelled", "canceled", "delivery_failed"].includes(order?.status?.toLowerCase() ?? "");

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-background" />;
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-error">
          {getApiErrorMessage(error) || "Order not found."}
        </div>
        <Link
          href="/"
          className="inline-block rounded-lg bg-brand px-6 py-2 font-semibold text-white transition hover:bg-brand-dark"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const showRider = Boolean(order.rider);
  const displayCode = order.displayRef || order.id;
  const backendPaid = Boolean(paymentStatusQ.data?.isPaid);
  const paid = backendPaid || (order.paymentStatus ?? "").toLowerCase() === "paid";
  const paymentLabel = paymentStatusQ.data?.paymentStatus ?? order.paymentStatus ?? "unknown";

  /** Keep checkout link path-only: do not open Paystack with `callback_url` / `return_url` query params. */
  function paystackCheckoutUrlOnly(authorizationUrl: string): string {
    try {
      const u = new URL(authorizationUrl);
      if (u.hostname !== "checkout.paystack.com") return authorizationUrl;
      u.searchParams.delete("callback_url");
      u.searchParams.delete("return_url");
      const q = u.searchParams.toString();
      return q ? `${u.origin}${u.pathname}?${q}` : `${u.origin}${u.pathname}`;
    } catch {
      return authorizationUrl;
    }
  }

  function onPayNow() {
    if (!order?.id || initializePayMut.isPending) return;
    initializePayMut.mutate(order.id, {
      onSuccess: (res) => {
        if (!res.authorizationUrl) {
          toast.error("Payment gateway URL unavailable. Please try again.");
          return;
        }
        if (typeof window !== "undefined" && res.reference) {
          window.sessionStorage.setItem("last_payment_reference", res.reference);
        }
        window.location.assign(paystackCheckoutUrlOnly(res.authorizationUrl));
      },
      onError: (e) => {
        toast.error(getApiErrorMessage(e));
      },
    });
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-8 text-white">
        <h1 className="mb-2 text-4xl font-bold">Order {displayCode}</h1>
        <p className="text-white/80">
          {isDelivered
            ? "Delivered — tracking is up to date."
            : isTerminal
              ? "This order is closed — status below."
              : "Live status — updates every few seconds"}
        </p>
        {isDelivered ? (
          <p className="mt-3 inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
            Delivered
          </p>
        ) : order?.tracking.step === "delivery_failed" ? (
          <p className="mt-3 inline-flex rounded-full bg-amber-500/30 px-4 py-1.5 text-sm font-semibold">
            Delivery issue
          </p>
        ) : order?.tracking.step === "cancelled" ? (
          <p className="mt-3 inline-flex rounded-full bg-zinc-500/40 px-4 py-1.5 text-sm font-semibold">
            Cancelled
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-foreground">Payment</h2>
          <StatusBadge value={paymentLabel} kind="payment" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!paid ? (
            <button
              type="button"
              disabled={initializePayMut.isPending}
              onClick={onPayNow}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {initializePayMut.isPending ? "Initializing..." : "Pay now"}
            </button>
          ) : (
            <span className="text-sm font-semibold text-emerald-500">Payment already confirmed.</span>
          )}
          <button
            type="button"
            onClick={() => paymentStatusQ.refetch()}
            disabled={paymentStatusQ.isFetching}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60"
          >
            {paymentStatusQ.isFetching ? "Checking..." : "Check payment status"}
          </button>
        </div>
        {paymentStatusQ.isError ? (
          <div className="mt-3">
            <ErrorStateRetry
              message={getApiErrorMessage(paymentStatusQ.error)}
              onRetry={() => paymentStatusQ.refetch()}
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Delivery status</h2>
        <DeliveryTimeline
          trackingStep={order.tracking.step}
          estimatedTime={estimatedLabel}
          deliveryIssue={order.deliveryIssue}
        />
      </div>

      {showRider && order.rider ? (
        <div className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Your rider</h2>
          <RiderCard
            rider={{
              name: order.rider.name,
              phone: order.rider.phone ?? "—",
              vehicle: order.rider.vehicle ?? "Delivery",
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Delivery details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-muted">Address</p>
              <p className="text-foreground">
                {order.addressLabel ? (
                  <>
                    <span className="font-medium">{order.addressLabel}</span>
                    <br />
                  </>
                ) : null}
                {order.addressLine ?? "—"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-muted">Payment</p>
              <p className="capitalize text-foreground">{order.paymentMethod}</p>
            </div>
            {order.storeName ? (
              <div>
                <p className="font-semibold text-muted">Store</p>
                <p className="text-foreground">{order.storeName}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Order summary</h3>
          <div className="mb-3 space-y-3 border-b border-border pb-3 text-sm">
            {order.items.length > 0 ? (
              order.items.map((item, i) => (
                <div key={item.id ?? `${item.productId}-${i}`} className="flex justify-between">
                  <span className="text-muted">
                    {item.name} ×{item.quantity}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(item.lineTotal || item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Line items will appear when the API includes them.</p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-brand">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row">
        <Link
          href="/orders/history"
          className="flex-1 rounded-lg border-2 border-border px-6 py-3 text-center font-semibold text-foreground transition hover:border-brand hover:bg-brand/5"
        >
          📋 Order history
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-lg bg-brand px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-dark"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
