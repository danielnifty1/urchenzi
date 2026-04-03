"use client";

import { useVendorDashboardStore } from "@/store/vendorDashboardStore";
import type { VendorFeatureFlags } from "@/types/vendorDashboard";
import clsx from "clsx";

const FEATURES: {
  key: keyof VendorFeatureFlags;
  title: string;
  description: string;
}[] = [
  {
    key: "onlineOrdering",
    title: "Online ordering",
    description: "Let customers place orders through the app and web.",
  },
  {
    key: "scheduledOrders",
    title: "Scheduled orders",
    description: "Accept orders for a later time slot.",
  },
  {
    key: "promoBanners",
    title: "Promo banners",
    description: "Highlight deals on your storefront carousel.",
  },
  {
    key: "customerNotifications",
    title: "Customer notifications",
    description: "Send updates when orders are accepted or on the way.",
  },
  {
    key: "analyticsEmails",
    title: "Analytics emails",
    description: "Weekly performance summaries to your inbox.",
  },
  {
    key: "autoAcceptOrders",
    title: "Auto-accept orders",
    description: "Skip manual confirmation for eligible orders.",
  },
];

export default function VendorFeaturesPage() {
  const features = useVendorDashboardStore((s) => s.features);
  const setFeatures = useVendorDashboardStore((s) => s.setFeatures);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Features</h2>
        <p className="text-sm text-muted">
          Toggle capabilities for your store. Changes apply to your demo session
          immediately.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => {
          const on = features[f.key];
          return (
            <div
              key={f.key}
              className={clsx(
                "flex gap-4 rounded-2xl border p-5 shadow-sm transition",
                on
                  ? "border-[#00A082]/40 bg-gradient-to-br from-[#00A082]/8 to-surface"
                  : "border-border bg-surface",
              )}
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Disable" : "Enable"} ${f.title}`}
                onClick={() => setFeatures({ [f.key]: !on })}
                className={clsx(
                  "mt-1 flex h-10 w-[3.5rem] flex-shrink-0 items-center rounded-full p-1 transition",
                  on ? "justify-end bg-[#00A082]" : "justify-start bg-muted",
                )}
              >
                <span className="h-8 w-8 rounded-full bg-white shadow-md" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
