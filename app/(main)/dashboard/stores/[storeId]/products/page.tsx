"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { ProductEditorModal } from "@/components/vendor/ProductEditorModal";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { getApiErrorMessage, isPermissionDeniedError } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorProducts,
  patchVendorProduct,
  uploadVendorMedia,
} from "@/services/vendorDashboardApi";
import type { VendorDashboardProduct } from "@/types/vendorDashboard";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

export default function DashboardStoreProductsPage() {
  const queryClient = useQueryClient();
  const { storeId, can, isLoading: permLoading, error: permError } = useStoreDashboard();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState<boolean | undefined>(undefined);
  const [layout, setLayout] = useState<"table" | "grid">("table");

  const filters = useMemo(
    () => ({ search, category, inStock: inStockOnly }),
    [search, category, inStockOnly],
  );

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.store(storeId) });

  const canView = can("product.view");
  const canCreate = can("product.create");
  const canUpdate = can("product.update");
  const canDelete = can("product.delete");

  const listQuery = useInfiniteQuery({
    queryKey: dashboardStoreKeys.products(storeId, filters),
    queryFn: ({ pageParam }) =>
      getVendorProducts({
        storeId,
        limit: 30,
        cursor: pageParam,
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        inStock: inStockOnly,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: canView && !permLoading,
  });

  const products = listQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const patchMut = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<VendorDashboardProduct, "id">>;
    }) => patchVendorProduct(id, patch),
    onSuccess: () => void invalidate(),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteVendorProduct,
    onSuccess: () => {
      toast.success("Product removed");
      void invalidate();
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

  const handleSave = async (form: Omit<VendorDashboardProduct, "id">) => {
    try {
      if (modalMode === "edit" && editing) {
        await patchVendorProduct(editing.id, form);
        toast.success("Product updated");
      } else {
        await createVendorProduct({ ...form, storeId });
        toast.success("Product added");
      }
      await invalidate();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      throw err;
    }
  };

  if (permError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
        {getApiErrorMessage(permError)}
      </div>
    );
  }

  if (permLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">Loading permissions…</div>
    );
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">No access</h2>
        <p className="mt-2 text-sm text-muted">
          You do not have <code className="rounded bg-muted px-1">product.view</code> for this store.
        </p>
      </div>
    );
  }

  const listDenied =
    listQuery.isError && isPermissionDeniedError(listQuery.error)
      ? getApiErrorMessage(listQuery.error)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted">Catalog for this store (x-store-id).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLayout("table")}
              className={clsx(
                "rounded-lg px-3 py-1.5",
                layout === "table" ? "bg-[#00A082] text-white" : "text-muted",
              )}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={clsx(
                "rounded-lg px-3 py-1.5",
                layout === "grid" ? "bg-[#00A082] text-white" : "text-muted",
              )}
            >
              Cards
            </button>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={openAdd}
              className="rounded-xl bg-[#00A082] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72]"
            >
              + Add product
            </button>
          ) : (
            <p className="text-xs text-muted">Requires product.create</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ds-search">
            Search
          </label>
          <input
            id="ds-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ds-cat">
            Group
          </label>
          <input
            id="ds-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Popular"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ds-stock">
            Stock
          </label>
          <select
            id="ds-stock"
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

      {listDenied ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          {listDenied}
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(listQuery.error)}</p>
      ) : null}

      {layout === "grid" ? (
        <div>
          {listQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-zinc-800/40" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted">
              {canCreate ? "No products yet. Add your first item." : "No products to show."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={() => openEdit(p)}
                  onDelete={() => {
                    if (confirm("Remove this product from the menu?")) deleteMut.mutate(p.id);
                  }}
                />
              ))}
            </div>
          )}
          {listQuery.hasNextPage ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
              >
                {listQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/80">
                  <th className="px-4 py-3 font-semibold text-foreground">Product</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Group</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Price</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      Loading products…
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      {canCreate ? "No products yet. Add your first item." : "No products to show."}
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element -- API URLs
                              <img src={p.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="line-clamp-1 text-xs text-muted">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.category}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => patchMut.mutate({ id: p.id, patch: { inStock: !p.inStock } })}
                            disabled={patchMut.isPending}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.inStock
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {p.inStock ? "In stock" : "Out of stock"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted">{p.inStock ? "In stock" : "Out of stock"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="mr-2 text-sm font-medium text-[#00A082] hover:underline"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="mr-2 text-xs text-muted">No product.update</span>
                        )}
                        {canDelete ? (
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
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {listQuery.hasNextPage ? (
            <div className="border-t border-border p-4 text-center">
              <button
                type="button"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
              >
                {listQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {canCreate || canUpdate ? (
        <ProductEditorModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          product={editing}
          onSave={handleSave}
          onUploadImage={async (file) => {
            const { url } = await uploadVendorMedia(file);
            return url;
          }}
        />
      ) : null}
    </div>
  );
}
