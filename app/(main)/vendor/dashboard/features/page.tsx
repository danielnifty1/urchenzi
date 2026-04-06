"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { vendorDashboardKeys } from "@/lib/vendorDashboard/queryKeys";
import { getVendorFeatures, patchVendorFeatures } from "@/services/vendorDashboardApi";
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
  const queryClient = useQueryClient();
  const { data: features, isLoading, isError, error } = useQuery({
    queryKey: vendorDashboardKeys.features(),
    queryFn: getVendorFeatures,
  });

  const mutation = useMutation({
    mutationFn: patchVendorFeatures,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading || !features) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-background" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-background" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Features</h2>
        <p className="text-sm text-muted">
          Toggle capabilities for your store. Changes are saved to the server.
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
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ [f.key]: !on })}
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
