"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { VendorField, VendorFormCard, vendorInputClass } from "@/components/admin/vendor/VendorFormCard";
import { adminVendorGetSettings } from "@/services/adminVendorApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import {
  extractSettingsBlob,
  getNum,
  getStr,
  STORE_CATEGORY_OPTIONS,
} from "@/lib/admin/vendorWorkspace";

const readOnlyClass = `${vendorInputClass} cursor-not-allowed bg-zinc-900/70 text-zinc-400`;

export default function AdminVendorSettingsPage() {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [category, setCategory] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [prepTimeMin, setPrepTimeMin] = useState("");
  const [prepTimeMax, setPrepTimeMax] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const raw = await adminVendorGetSettings(vendorId);
        if (cancelled) return;
        const s = extractSettingsBlob(raw);
        setStoreName(getStr(s, "storeName", "store_name"));
        setTagline(getStr(s, "tagline", "tag_line"));
        setStoreSlug(getStr(s, "storeSlug", "store_slug"));
        setCategory(getStr(s, "category", "category"));
        setMinOrder(String(getNum(s, "minOrder", "min_order") ?? ""));
        setDeliveryFee(String(getNum(s, "deliveryFee", "delivery_fee") ?? ""));
        setPrepTimeMin(String(getNum(s, "prepTimeMin", "prep_time_min") ?? ""));
        setPrepTimeMax(String(getNum(s, "prepTimeMax", "prep_time_max") ?? ""));
        const open = s.isOpen ?? s.is_open;
        setIsOpen(open === true || open === "true" || open === 1);
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

  const categoryOptions = useMemo(() => {
    const base = [...STORE_CATEGORY_OPTIONS];
    if (category && !base.some((o) => o.value === category)) {
      base.push({ value: category, label: category });
    }
    return base;
  }, [category]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-zinc-900" />
        <div className="h-96 rounded-2xl bg-zinc-900" />
      </div>
    );
  }
  if (loadError) {
    return <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-red-200">{loadError}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Store settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Read-only view for administrators. The approved store owner updates settings through the vendor dashboard
          APIs (authenticated vendor session).
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
        Admin vendor routes expose <span className="font-medium">GET</span> settings only. PATCH is not available on
        admin endpoints.
      </div>

      <div className="space-y-8">
        <VendorFormCard title="Store identity" description="Name, messaging, and URL slug customers see.">
          <div className="grid gap-4 sm:grid-cols-2">
            <VendorField label="Store name" htmlFor="storeName">
              <input id="storeName" readOnly value={storeName} className={readOnlyClass} />
            </VendorField>
            <VendorField label="Category" htmlFor="category">
              <select id="category" disabled value={category} className={readOnlyClass}>
                {categoryOptions.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </VendorField>
          </div>
          <VendorField label="Tagline" htmlFor="tagline" hint="Short line under the store name.">
            <input id="tagline" readOnly value={tagline} className={readOnlyClass} />
          </VendorField>
          <VendorField label="Store slug" htmlFor="storeSlug" hint="URL-safe identifier (e.g. my-kids-world).">
            <input id="storeSlug" readOnly value={storeSlug} className={`${readOnlyClass} font-mono text-xs`} />
          </VendorField>
        </VendorFormCard>

        <VendorFormCard title="Orders & delivery" description="Fees, minimums, and prep time windows.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <VendorField label="Minimum order" htmlFor="minOrder">
              <input id="minOrder" type="text" readOnly value={minOrder} className={readOnlyClass} />
            </VendorField>
            <VendorField label="Delivery fee" htmlFor="deliveryFee">
              <input id="deliveryFee" type="text" readOnly value={deliveryFee} className={readOnlyClass} />
            </VendorField>
            <VendorField label="Prep time (min)" htmlFor="prepTimeMin">
              <input id="prepTimeMin" type="text" readOnly value={prepTimeMin} className={readOnlyClass} />
            </VendorField>
            <VendorField label="Prep time (max)" htmlFor="prepTimeMax">
              <input id="prepTimeMax" type="text" readOnly value={prepTimeMax} className={readOnlyClass} />
            </VendorField>
          </div>
        </VendorFormCard>

        <VendorFormCard title="Availability" description="Whether the store accepts new orders right now.">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-4">
            <div>
              <p className="font-medium text-zinc-200">Store is open</p>
              <p className="mt-0.5 text-sm text-zinc-500">Shown as reported by GET settings.</p>
            </div>
            <div
              className={`relative h-8 w-14 shrink-0 rounded-full ${isOpen ? "bg-emerald-600/50" : "bg-zinc-700"}`}
              aria-hidden
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white/80 shadow transition-transform ${
                  isOpen ? "left-7" : "left-1"
                }`}
              />
            </div>
          </div>
        </VendorFormCard>
      </div>
    </div>
  );
}
