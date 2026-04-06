"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { adminVendorListProducts } from "@/services/adminVendorApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { resolveMediaUrl } from "@/lib/admin/publicOrigin";

function productId(row: Record<string, unknown>): string {
  const id = row.id ?? row.productId ?? row._id ?? row.product_id;
  return id != null ? String(id) : "";
}

function productName(row: Record<string, unknown>): string {
  const n = row.name ?? row.title ?? row.productName ?? row.product_name ?? row.label;
  return n != null ? String(n) : "—";
}

function productPrice(row: Record<string, unknown>): string {
  const p = row.price ?? row.amount ?? row.unitPrice ?? row.unit_price ?? row.sellingPrice ?? row.selling_price;
  return p != null ? String(p) : "—";
}

function productImage(row: Record<string, unknown>): string {
  const img =
    row.image ??
    row.imageUrl ??
    row.image_url ??
    row.photoUrl ??
    row.photo_url ??
    row.thumbnailUrl ??
    row.thumbnail_url;
  return typeof img === "string" ? resolveMediaUrl(img) : "";
}

export default function AdminVendorProductsPage() {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");

  const listQuery = useInfiniteQuery({
    queryKey: ["admin-vendor-products", vendorId],
    queryFn: ({ pageParam }) =>
      adminVendorListProducts(vendorId, {
        limit: 80,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(vendorId),
  });

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [listQuery.data],
  );

  if (listQuery.isLoading) return <p className="text-zinc-500">Loading products…</p>;
  if (listQuery.error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-200">
        {formatAdminError(listQuery.error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Catalog from{" "}
            <span className="font-mono text-zinc-400">GET /admin/vendors/:vendorId/products</span> (read-only). Use{" "}
            <Link href={`/admin/${vendorId}`} className="text-emerald-500 hover:underline">
              Overview
            </Link>{" "}
            to suspend, ban, or reinstate the linked store owner.
          </p>
        </div>
        {listQuery.hasNextPage ? (
          <button
            type="button"
            disabled={listQuery.isFetchingNextPage}
            onClick={() => void listQuery.fetchNextPage()}
            className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {listQuery.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Image</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-zinc-500">
                  No products returned. If this store has a menu, check that the API list uses a field we parse
                  (e.g. <span className="font-mono text-zinc-400">items</span>,{" "}
                  <span className="font-mono text-zinc-400">content</span>, or a nested{" "}
                  <span className="font-mono text-zinc-400">data</span> object).
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = productId(row);
                const name = productName(row);
                const price = productPrice(row);
                const src = productImage(row);
                return (
                  <tr key={id || JSON.stringify(row).slice(0, 48)} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2 font-mono text-xs text-zinc-500">{id || "—"}</td>
                    <td className="px-3 py-2 text-zinc-200">{name}</td>
                    <td className="px-3 py-2 text-zinc-300">{price}</td>
                    <td className="px-3 py-2">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
