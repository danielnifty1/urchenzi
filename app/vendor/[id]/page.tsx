"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { useVendor, useVendorProducts } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";

export default function VendorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const { data: products, isLoading: productsLoading, isError } = useVendorProducts(id);
  const subtotal = useCartStore((state) => state.subtotal());
  const count = useCartStore((state) => state.items.length);

  return (
    <section className="space-y-6 pb-24">
      {vendorLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : vendor ? (
        <header className="rounded-2xl border border-border bg-surface p-5">
          <h1 className="text-2xl font-bold">{vendor.name}</h1>
          <p className="mt-1 text-sm text-muted">{vendor.description}</p>
          <p className="mt-2 text-sm text-muted">
            {vendor.rating.toFixed(1)} ★ • {vendor.deliveryTime}
          </p>
        </header>
      ) : (
        <p>Vendor not found.</p>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Menu</h2>
        {productsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-2xl bg-background" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            Unable to load products.
          </p>
        ) : (
          <div className="space-y-3">
            {products?.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-8">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-2xl bg-brand-strong px-4 py-3 text-white shadow-lg"
          >
            <span>{count} items in cart</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </Link>
        </div>
      )}
    </section>
  );
}
