"use client";

import { Fragment } from "react";
import type { CustomerOrderTrackingStep } from "@/services/customerOrdersApi";
import { deliveryIssueMessage } from "@/lib/customer/deliveryIssueCopy";
import { OrderStatus } from "@/types";

const API_TRACKING_STEPS: { step: CustomerOrderTrackingStep; label: string; icon: string }[] = [
  { step: "order_placed", label: "Order placed", icon: "📦" },
  { step: "confirmed", label: "Confirmed", icon: "✅" },
  { step: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { step: "assigned", label: "Assigned", icon: "🚗" },
  { step: "on_the_way", label: "On the way", icon: "🚚" },
  { step: "delivered", label: "Delivered", icon: "🎉" },
];

const LEGACY_TIMELINE: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "Pending", label: "Order Placed", icon: "📦" },
  { status: "Accepted", label: "Confirmed", icon: "✅" },
  { status: "Rider Assigned", label: "Assigned", icon: "🚗" },
  { status: "On the way", label: "On the way", icon: "🚚" },
  { status: "Delivered", label: "Delivered", icon: "🎉" },
];

type Props = {
  /** From GET /customers/orders/:ref — `order.tracking.step` */
  trackingStep?: CustomerOrderTrackingStep | string | null;
  /** Legacy demo / mock orders */
  currentStatus?: OrderStatus;
  estimatedTime?: string;
  /** When status is `delivery_failed`, maps `deliveryIssue.code` to copy. */
  deliveryIssue?: { code: number } | null;
};

function normalizeApiStep(raw: string | null | undefined): CustomerOrderTrackingStep | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/-/g, "_");
  if (s === "delivery_failed" || s === "cancelled") return s as CustomerOrderTrackingStep;
  const found = API_TRACKING_STEPS.find((x) => x.step === s);
  return found ? found.step : null;
}

export const DeliveryTimeline = ({
  trackingStep,
  currentStatus,
  estimatedTime,
  deliveryIssue,
}: Props) => {
  const apiStep = normalizeApiStep(trackingStep ?? undefined);

  if (apiStep === "delivery_failed") {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-amber-100">
          <p className="font-semibold text-amber-50">Delivery couldn&apos;t be completed</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
            {deliveryIssue != null ? deliveryIssueMessage(deliveryIssue.code) : "The rider reported that delivery could not be completed. The store may contact you or try again."}
          </p>
        </div>
      </div>
    );
  }

  if (apiStep === "cancelled") {
    return (
      <div className="w-full rounded-xl border border-border bg-background/80 p-4 text-foreground">
        <p className="font-semibold">This order was cancelled</p>
        <p className="mt-1 text-sm text-muted">No further delivery updates.</p>
      </div>
    );
  }

  if (apiStep) {
    const currentIndex = API_TRACKING_STEPS.findIndex((s) => s.step === apiStep);
    const idx = currentIndex >= 0 ? currentIndex : 0;

    return (
      <div className="w-full overflow-x-auto pb-1">
        <div className="flex min-w-[min(100%,720px)] items-center">
          {API_TRACKING_STEPS.map((step, index) => (
            <Fragment key={step.step}>
              <div className="flex w-14 shrink-0 flex-col items-center sm:w-16">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition sm:h-11 sm:w-11 sm:text-base ${
                    index <= idx ? "bg-brand text-white shadow-md" : "border border-border bg-background text-muted"
                  }`}
                >
                  {step.icon}
                </div>
                <p className="mt-2 max-w-[4.5rem] text-center text-[9px] font-medium leading-tight text-foreground sm:text-[11px]">
                  {step.label}
                </p>
              </div>
              {index < API_TRACKING_STEPS.length - 1 ? (
                <div
                  className={`mx-0.5 h-1 min-h-[4px] min-w-[8px] flex-1 rounded-full ${index < idx ? "bg-brand" : "bg-border"}`}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          ))}
        </div>

        {estimatedTime ? (
          <div className="mt-6 rounded-lg bg-brand/10 p-4 text-center">
            <p className="text-sm text-muted">Estimated delivery</p>
            <p className="text-lg font-bold text-brand">{estimatedTime}</p>
          </div>
        ) : null}
      </div>
    );
  }

  const status = currentStatus ?? "Pending";
  const currentIndex = LEGACY_TIMELINE.findIndex((step) => step.status === status);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {LEGACY_TIMELINE.map((step, index) => (
          <div key={step.status} className="flex flex-col items-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition ${
                index <= currentIndex
                  ? "bg-brand text-white shadow-md"
                  : "border border-border bg-background text-muted"
              }`}
            >
              {step.icon}
            </div>
            <p className="mt-2 text-center text-xs font-medium text-foreground">{step.label}</p>

            {index < LEGACY_TIMELINE.length - 1 && (
              <div
                className={`my-2 h-1 w-16 transition ${index < currentIndex ? "bg-brand" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {estimatedTime ? (
        <div className="mt-6 rounded-lg bg-brand/10 p-4 text-center">
          <p className="text-sm text-muted">Estimated delivery</p>
          <p className="text-lg font-bold text-brand">{estimatedTime}</p>
        </div>
      ) : null}
    </div>
  );
};
