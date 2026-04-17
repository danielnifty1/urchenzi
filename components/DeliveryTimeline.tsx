"use client";

import { OrderStatus } from "@/types";

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "Pending", label: "Order Placed", icon: "📦" },
  { status: "Accepted", label: "Confirmed", icon: "✅" },
  { status: "Rider Assigned", label: "Assigned", icon: "🚗" },
  { status: "On the way", label: "On the way", icon: "🚚" },
  { status: "Delivered", label: "Delivered", icon: "🎉" },
];

interface DeliveryTimelineProps {
  currentStatus: OrderStatus;
  estimatedTime?: string;
}

export const DeliveryTimeline = ({
  currentStatus,
  estimatedTime,
}: DeliveryTimelineProps) => {
  const currentIndex = TIMELINE_STEPS.findIndex(
    (step) => step.status === currentStatus,
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {TIMELINE_STEPS.map((step, index) => (
          <div key={step.status} className="flex flex-col items-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition ${
                index <= currentIndex
                  ? "bg-brand text-white shadow-md"
                  : "bg-background text-muted border border-border"
              }`}
            >
              {step.icon}
            </div>
            <p className="mt-2 text-center text-xs font-medium text-foreground">
              {step.label}
            </p>

            {index < TIMELINE_STEPS.length - 1 && (
              <div
                className={`my-2 h-1 w-16 transition ${
                  index < currentIndex ? "bg-brand" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {estimatedTime && (
        <div className="mt-6 rounded-lg bg-brand/10 p-4 text-center">
          <p className="text-sm text-muted">Estimated delivery</p>
          <p className="text-lg font-bold text-brand">{estimatedTime}</p>
        </div>
      )}
    </div>
  );
}; 

