"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { VendorFormCard } from "@/components/admin/vendor/VendorFormCard";
import { adminVendorGetFeatures } from "@/services/adminVendorApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { extractFeaturesBlob, humanizeKey, VENDOR_FEATURE_META } from "@/lib/admin/vendorWorkspace";

function buildFeatureState(raw: unknown): Record<string, boolean> {
  const blob = extractFeaturesBlob(raw);
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(blob)) {
    if (typeof v === "boolean") out[k] = v;
    else if (v === "true" || v === 1) out[k] = true;
    else if (v === "false" || v === 0) out[k] = false;
  }
  for (const key of Object.keys(VENDOR_FEATURE_META)) {
    if (out[key] === undefined) out[key] = false;
  }
  return out;
}

function orderedFeatureKeys(flags: Record<string, boolean>): string[] {
  const known = Object.keys(VENDOR_FEATURE_META);
  const rest = Object.keys(flags).filter((k) => !known.includes(k));
  rest.sort();
  return [...known.filter((k) => k in flags), ...rest];
}

export default function AdminVendorFeaturesPage() {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await adminVendorGetFeatures(vendorId);
        if (cancelled) return;
        setFlags(buildFeatureState(data));
      } catch (e) {
        if (!cancelled) setLoadError(formatAdminError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const keys = useMemo(() => orderedFeatureKeys(flags), [flags]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-zinc-900" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }
  if (loadError) {
    return <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-red-200">{loadError}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Feature flags</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Read-only snapshot from GET features. Store owners change flags via the vendor dashboard; admin PATCH is not
          exposed.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
        This page is for review only. Editing happens on vendor-authenticated routes.
      </div>

      <VendorFormCard
        title="Capabilities"
        description="Current flag values. Unknown flags from the API are listed at the bottom."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {keys.map((key) => {
            const on = flags[key] ?? false;
            const meta = VENDOR_FEATURE_META[key];
            const label = meta?.label ?? humanizeKey(key);
            const desc = meta?.description ?? "Feature flag from API.";
            return (
              <div
                key={key}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-200">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
                  <p className="mt-2 font-mono text-[10px] text-zinc-600">{key}</p>
                </div>
                <div
                  className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full ${on ? "bg-emerald-600/50" : "bg-zinc-700"}`}
                  aria-label={on ? "On" : "Off"}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white/80 shadow ${
                      on ? "left-7" : "left-1"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </VendorFormCard>
    </div>
  );
}
