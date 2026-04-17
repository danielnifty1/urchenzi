"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { getVendorSettings, patchVendorSettings } from "@/services/vendorDashboardApi";
import type { VendorProductImagePayload, VendorStoreSettings } from "@/types/vendorDashboard";
import type { VendorCategory } from "@/types";

const CATEGORIES: VendorCategory[] = [
  "food",
  "groceries",
  "pharmacy",
  "shops",
  "restaurants",
  "supermarkets",
  "flowers",
  "alcohol",
  "quick-commerce",
];

function buildSettingsPatch(draft: VendorStoreSettings): Partial<VendorStoreSettings> {
  const slug = draft.storeSlug?.trim();
  return {
    storeName: draft.storeName,
    tagline: draft.tagline,
    category: draft.category,
    minOrder: draft.minOrder,
    deliveryFee: draft.deliveryFee,
    prepTimeMin: draft.prepTimeMin,
    prepTimeMax: draft.prepTimeMax,
    isOpen: draft.isOpen,
    storeSlug: slug ? slug : undefined,
  };
}

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { storeId } = useStoreDashboard();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: dashboardStoreKeys.settings(storeId),
    queryFn: () => getVendorSettings(storeId),
  });

  const [draft, setDraft] = useState<VendorStoreSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<VendorProductImagePayload | undefined>(undefined);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (patch: Partial<VendorStoreSettings> & { image?: VendorProductImagePayload }) =>
      patchVendorSettings(patch, storeId),
    onSuccess: () => {
      setPendingImage(undefined);
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.store(storeId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading || !draft) {
    return (
      <div className="max-w-xl animate-pulse space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div className="h-8 w-40 bg-background" />
        <div className="h-10 w-full bg-background" />
        <div className="h-10 w-full bg-background" />
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
        <h2 className="text-xl font-bold text-foreground">Store settings</h2>
        <p className="mt-1 text-sm text-muted">How this location appears to customers.</p>
      </div>

      <form
        className="max-w-2xl space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ ...buildSettingsPatch(draft), image: pendingImage });
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="storeImage">
            Store image
          </label>
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-background">
              {draft.storeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.storeImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
              )}
            </div>
            <div>
              <input
                id="storeImage"
                type="file"
                accept="image/*"
                className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#00A082] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const image = await imagePayloadFromFile(file, "store image");
                    const url = URL.createObjectURL(file);
                    setPendingImage(image);
                    setDraft((d) => (d ? { ...d, storeImage: url } : d));
                    toast.success("Image ready — save to persist");
                  } catch (err) {
                    toast.error(getApiErrorMessage(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading ? <p className="mt-1 text-xs text-muted">Uploading…</p> : null}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="storeName">
            Store name
          </label>
          <input
            id="storeName"
            value={draft.storeName}
            onChange={(e) => setDraft((d) => (d ? { ...d, storeName: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={draft.description ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            placeholder="Tell customers what makes this store special."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="openingHours">
            Opening hours
          </label>
          <input
            id="openingHours"
            value={draft.openingHours ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, openingHours: e.target.value } : d))}
            placeholder="e.g. Mon–Sat 9:00–21:00"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="tagline">
            Tagline
          </label>
          <input
            id="tagline"
            value={draft.tagline}
            onChange={(e) => setDraft((d) => (d ? { ...d, tagline: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="storeSlug">
            Store slug (URL)
          </label>
          <input
            id="storeSlug"
            value={draft.storeSlug ?? ""}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, storeSlug: e.target.value || undefined } : d))
            }
            placeholder="e.g. my-kitchen"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, category: e.target.value as VendorCategory } : d))
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="minOrder">
              Minimum order (USD)
            </label>
            <input
              id="minOrder"
              type="number"
              min={0}
              step={0.01}
              value={draft.minOrder}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, minOrder: parseFloat(e.target.value) || 0 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="deliveryFee">
              Delivery fee (USD)
            </label>
            <input
              id="deliveryFee"
              type="number"
              min={0}
              step={0.01}
              value={draft.deliveryFee}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, deliveryFee: parseFloat(e.target.value) || 0 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="prepMin">
              Prep time min (min)
            </label>
            <input
              id="prepMin"
              type="number"
              min={1}
              value={draft.prepTimeMin}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, prepTimeMin: parseInt(e.target.value, 10) || 1 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="prepMax">
              Prep time max (min)
            </label>
            <input
              id="prepMax"
              type="number"
              min={1}
              value={draft.prepTimeMax}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, prepTimeMax: parseInt(e.target.value, 10) || 1 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={draft.isOpen}
            onChange={(e) => setDraft((d) => (d ? { ...d, isOpen: e.target.checked } : d))}
            className="h-4 w-4 rounded border-border text-[#00A082] focus:ring-[#00A082]"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Store is open</span>
            <p className="text-xs text-muted">When closed, customers see you as unavailable.</p>
          </div>
        </label>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-xl bg-[#00A082] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72] disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
