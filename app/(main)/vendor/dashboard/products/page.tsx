"use client";

import { useState } from "react";
import { ProductEditorModal } from "@/components/vendor/ProductEditorModal";
import { useVendorDashboardStore } from "@/store/vendorDashboardStore";
import type { VendorDashboardProduct } from "@/types/vendorDashboard";
import { formatCurrency } from "@/utils/format";

export default function VendorProductsPage() {
  const products = useVendorDashboardStore((s) => s.products);
  const addProduct = useVendorDashboardStore((s) => s.addProduct);
  const updateProduct = useVendorDashboardStore((s) => s.updateProduct);
  const removeProduct = useVendorDashboardStore((s) => s.removeProduct);
  const resetDemo = useVendorDashboardStore((s) => s.resetDemo);

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

  const handleSave = (data: Omit<VendorDashboardProduct, "id">) => {
    if (modalMode === "edit" && editing) {
      updateProduct(editing.id, data);
    } else {
      addProduct(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Menu & products</h2>
          <p className="text-sm text-muted">
            Add dishes, set prices, and control availability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => resetDemo()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition hover:bg-background"
          >
            Reset demo
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-[#00A082] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72]"
          >
            + Add product
          </button>
        </div>
      </div>

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
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied URLs */}
                        <img
                          src={p.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
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
                      onClick={() => updateProduct(p.id, { inStock: !p.inStock })}
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
                      onClick={() => removeProduct(p.id)}
                      className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
