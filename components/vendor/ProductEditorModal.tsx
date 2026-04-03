"use client";

import { useEffect, useState } from "react";
import type { VendorDashboardProduct } from "@/types/vendorDashboard";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  product: VendorDashboardProduct | null;
  onSave: (data: Omit<VendorDashboardProduct, "id">) => void;
};

const empty: Omit<VendorDashboardProduct, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "Popular",
  inStock: true,
  image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
};

export function ProductEditorModal({
  open,
  onClose,
  mode,
  product,
  onSave,
}: Props) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && product) {
      const { id: _id, ...rest } = product;
      setForm(rest);
    } else {
      setForm(empty);
    }
  }, [open, mode, product]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="product-editor-title" className="text-xl font-bold text-foreground">
              {mode === "add" ? "Add product" : "Edit product"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Items appear on your storefront menu when in stock.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-background"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-name">
              Name
            </label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="p-desc"
            >
              Description
            </label>
            <textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-price">
                Price (USD)
              </label>
              <input
                id="p-price"
                type="number"
                required
                min={0}
                step={0.01}
                value={form.price || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="p-cat"
              >
                Menu group
              </label>
              <input
                id="p-cat"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Popular, Drinks"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-img">
              Image URL
            </label>
            <input
              id="p-img"
              type="url"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-[#00A082] focus:ring-[#00A082]"
            />
            <span className="text-sm font-medium text-foreground">In stock</span>
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "rounded-xl px-5 py-2.5 text-sm font-semibold",
                "border border-border text-foreground hover:bg-background",
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/25 transition hover:bg-[#008f72]"
            >
              {mode === "add" ? "Add product" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
