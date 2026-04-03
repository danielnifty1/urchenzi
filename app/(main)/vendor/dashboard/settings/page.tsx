"use client";

import { useVendorDashboardStore } from "@/store/vendorDashboardStore";
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

export default function VendorSettingsPage() {
  const settings = useVendorDashboardStore((s) => s.settings);
  const setSettings = useVendorDashboardStore((s) => s.setSettings);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Store settings</h2>
        <p className="text-sm text-muted">
          How your business appears to customers and baseline delivery rules.
        </p>
      </div>

      <form
        className="max-w-xl space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="storeName">
            Store name
          </label>
          <input
            id="storeName"
            value={settings.storeName}
            onChange={(e) => setSettings({ storeName: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="tagline">
            Tagline
          </label>
          <input
            id="tagline"
            value={settings.tagline}
            onChange={(e) => setSettings({ tagline: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={settings.category}
            onChange={(e) =>
              setSettings({ category: e.target.value as VendorCategory })
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
              value={settings.minOrder}
              onChange={(e) =>
                setSettings({ minOrder: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="deliveryFee"
            >
              Delivery fee (USD)
            </label>
            <input
              id="deliveryFee"
              type="number"
              min={0}
              step={0.01}
              value={settings.deliveryFee}
              onChange={(e) =>
                setSettings({ deliveryFee: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="prepMin"
            >
              Prep time min (min)
            </label>
            <input
              id="prepMin"
              type="number"
              min={1}
              value={settings.prepTimeMin}
              onChange={(e) =>
                setSettings({ prepTimeMin: parseInt(e.target.value, 10) || 1 })
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="prepMax"
            >
              Prep time max (min)
            </label>
            <input
              id="prepMax"
              type="number"
              min={1}
              value={settings.prepTimeMax}
              onChange={(e) =>
                setSettings({ prepTimeMax: parseInt(e.target.value, 10) || 1 })
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={settings.isOpen}
            onChange={(e) => setSettings({ isOpen: e.target.checked })}
            className="h-4 w-4 rounded border-border text-[#00A082] focus:ring-[#00A082]"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Store is open</span>
            <p className="text-xs text-muted">
              When closed, you can still edit — customers see you as unavailable.
            </p>
          </div>
        </label>
      </form>
    </div>
  );
}
