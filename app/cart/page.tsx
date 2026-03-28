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
    <section className="space-y-8">
      <div className="rounded-3xl bg-brand p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Your Cart</h1>
        <p className="text-white/80">Review items and proceed to checkout</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-surface border border-border p-6 space-y-3">
            <h2 className="text-xl font-bold text-foreground mb-4">Items ({items.length})</h2>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-6 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-foreground mb-4">Summary</h2>
          <div className="space-y-3 mb-6 pb-4 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery</span>
              <span className="font-medium">{formatCurrency(2.5)}</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold mb-6">
            <span>Total</span>
            <span className="text-brand">{formatCurrency(subtotal + 2.5)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full rounded-lg bg-brand px-4 py-3 text-center font-bold text-white hover:bg-brand-dark transition mb-3"
          >
            Proceed to Checkout
          </Link>

          <Link
            href="/"
            className="block w-full rounded-lg border-2 border-border px-4 py-3 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
