"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ProductEditorModal, type ProductEditorSaveData } from "@/components/vendor/ProductEditorModal";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { getActiveStoreId } from "@/lib/store/activeStoreId";
import { vendorDashboardKeys } from "@/lib/vendorDashboard/queryKeys";
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorProducts,
  patchVendorProduct,
  uploadVendorMedia,
} from "@/services/vendorDashboardApi";
import type { PatchVendorProductPayload, VendorDashboardProduct } from "@/types/vendorDashboard";
import { formatCurrency } from "@/utils/format";

export default function VendorProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState<boolean | undefined>(undefined);

  const filters = useMemo(
    () => ({ search, category, inStock: inStockOnly }),
    [search, category, inStockOnly],
  );

  const invalidateVendor = () =>
    queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.all });

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: vendorDashboardKeys.products(filters),
    queryFn: ({ pageParam }) =>
      getVendorProducts({
        limit: 20,
        cursor: pageParam,
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        inStock: inStockOnly,
      }),
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const products = data?.pages.flatMap((p) => p.items) ?? [];

  const patchMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PatchVendorProductPayload }) =>
      patchVendorProduct(id, patch),
    onSuccess: () => {
      void invalidateVendor();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteVendorProduct,
    onSuccess: () => {
      toast.success("Product removed");
      void invalidateVendor();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<VendorDashboardProduct | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (p: VendorDashboardProduct) => {
    setEditing(p);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleSave = async (data: ProductEditorSaveData) => {
    try {
      if (modalMode === "edit" && editing) {
        const patch: PatchVendorProductPayload = {
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          price: Math.round(data.price * 100) / 100,
          category: data.category.trim() || undefined,
          inStock: data.inStock,
        };
        if (data.imageFile) {
          const { url } = await uploadVendorMedia(data.imageFile);
          patch.image = url;
        } else {
          patch.image = data.imageUrl.trim() === "" ? null : data.imageUrl.trim();
        }
        await patchVendorProduct(editing.id, patch);
        toast.success("Product updated");
      } else {
        const sid = getActiveStoreId();
        if (!sid) {
          toast.error("Select a store in the multi-store dashboard (/dashboard) so products include storeId.");
          throw new Error("Missing store context");
        }
        if (!data.imageFile) {
          toast.error("Choose a product image");
          throw new Error("Missing image");
        }
        const img = await imagePayloadFromFile(data.imageFile, "product");
        await createVendorProduct({
          storeId: sid,
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          price: Math.round(data.price * 100) / 100,
          category: data.category.trim() || undefined,
          inStock: data.inStock,
          image: { data: img.data, fileName: img.fileName, mimeType: img.mimeType },
        });
        toast.success("Product added");
      }
      await invalidateVendor();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Menu & products</h2>
          <p className="text-sm text-muted">
            Add dishes, set prices, and control availability. Synced with the API.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-[#00A082] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72]"
        >
          + Add product
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="vf-search">
            Search
          </label>
          <input
            id="vf-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="vf-cat">
            Group
          </label>
          <input
            id="vf-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Popular"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="vf-stock">
            Stock
          </label>
          <select
            id="vf-stock"
            value={inStockOnly === undefined ? "" : inStockOnly ? "in" : "out"}
            onChange={(e) => {
              const v = e.target.value;
              setInStockOnly(v === "" ? undefined : v === "in");
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(error)}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/80">
                <th className="px-4 py-3 font-semibold text-foreground">Product</th>
                <th className="px-4 py-3 font-semibold text-foreground">Group</th>
                <th className="px-4 py-3 font-semibold text-foreground">Price</th>
                <th className="px-4 py-3 font-semibold text-foreground">Stock</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No products yet. Add your first item.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element -- API URLs */}
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element -- API URLs */
                            <img
                              src={p.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{p.name}</div>
                          <div className="line-clamp-1 text-xs text-muted">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          patchMut.mutate({ id: p.id, patch: { inStock: !p.inStock } })
                        }
                        disabled={patchMut.isPending}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.inStock
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {p.inStock ? "In stock" : "Out of stock"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="mr-2 text-sm font-medium text-[#00A082] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Remove this product from the menu?")) {
                            deleteMut.mutate(p.id);
                          }
                        }}
                        className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasNextPage ? (
          <div className="border-t border-border p-4 text-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </div>

      <ProductEditorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        product={editing}
        onSave={handleSave}
      />
    </div>
  );
}
