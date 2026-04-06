"use client";

import Link from "next/link";
import { CartItem } from "@/components/CartItem";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());

  if (items.length === 0) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-5xl">🛒</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Cart is Empty</h1>
          <p className="text-muted mb-6">Add delicious items from vendors to get started</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            Browse Vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl bg-brand p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Your Cart</h1>
        <p className="text-sm sm:text-base text-white/80">Review items and proceed to checkout</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-surface border border-border p-4 sm:p-6 space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Items ({items.length})</h2>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-4 sm:p-6 h-fit lg:sticky lg:top-24">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Summary</h2>
          <div className="space-y-3 mb-6 pb-4 border-b border-border">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted">Delivery</span>
              <span className="font-medium">{formatCurrency(2.5)}</span>
            </div>
          </div>

          <div className="flex justify-between text-base sm:text-lg font-bold mb-6">
            <span>Total</span>
            <span className="text-brand">{formatCurrency(subtotal + 2.5)}</span>
          </div>

          <div className="space-y-2">
            <Link
              href="/checkout"
              className="block w-full rounded-lg bg-brand px-4 py-2.5 sm:py-3 text-center font-bold text-white hover:bg-brand-dark transition text-sm sm:text-base"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/"
              className="block w-full rounded-lg border-2 border-border px-4 py-2.5 sm:py-3 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition text-sm sm:text-base"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
