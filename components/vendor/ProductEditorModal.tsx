"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { VendorDashboardProduct } from "@/types/vendorDashboard";
import clsx from "clsx";

export type ProductEditorSaveData = {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  /** Current image URL (edit). Empty on create until a file is chosen. */
  imageUrl: string;
  /** Create: required for API (nested image). Edit: optional replacement (upload → URL on server). */
  imageFile: File | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  product: VendorDashboardProduct | null;
  onSave: (data: ProductEditorSaveData) => void | Promise<void>;
};

type FormState = Omit<ProductEditorSaveData, "imageFile">;

const empty: FormState = {
  name: "",
  description: "",
  price: 0,
  category: "Popular",
  inStock: true,
  imageUrl: "",
};

export function ProductEditorModal({ open, onClose, mode, product, onSave }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && product) {
      const { id: _id, image, ...rest } = product;
      setForm({ ...rest, imageUrl: image ?? "" });
      setImageFile(null);
      setPreviewUrl(null);
    } else {
      setForm(empty);
      setImageFile(null);
      setPreviewUrl(null);
    }
  }, [open, mode, product]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  if (!open) return null;

  const displayImage = previewUrl || (form.imageUrl.trim() ? form.imageUrl : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "add" && !imageFile) {
      toast.error("Choose an image file for the product.");
      return;
    }
    await Promise.resolve(
      onSave({
        ...form,
        imageFile,
      }),
    );
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
              {mode === "add"
                ? "New products require an image file (sent as nested image data to the API)."
                : "Update fields; image can stay as URL or upload a replacement file."}
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
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-desc">
              Description
            </label>
            <textarea
              id="p-desc"
              rows={3}
              maxLength={5000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-price">
                Price
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
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-cat">
                Menu group
              </label>
              <input
                id="p-cat"
                maxLength={100}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Popular, Drinks"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="p-img-file">
              Image {mode === "add" ? <span className="text-rose-600">*</span> : null}
            </label>
            {displayImage ? (
              <div className="mb-2 overflow-hidden rounded-xl border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob or API URL */}
                <img src={displayImage} alt="" className="h-40 w-full object-cover" />
              </div>
            ) : null}
            <input
              id="p-img-file"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#00A082]/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#00A082]"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                e.target.value = "";
              }}
            />
            {mode === "add" && !imageFile ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Choose an image file to create this product.</p>
            ) : null}
            {mode === "edit" ? (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor="p-img-url">
                  Image URL (optional — used if you don&apos;t upload a file)
                </label>
                <input
                  id="p-img-url"
                  type="url"
                  maxLength={2048}
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-brand/30 focus:ring-2"
                />
              </div>
            ) : null}
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
              disabled={mode === "add" && !imageFile}
              className="rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/25 transition hover:bg-[#008f72] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "add" ? "Add product" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
