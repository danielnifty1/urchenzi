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
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add items from a vendor to continue.</p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-brand-strong px-4 py-2 text-sm text-white"
        >
          Browse vendors
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Cart</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">Total</span>
          <span className="text-lg font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 font-semibold text-[#10131a]"
        >
          Proceed to checkout
        </Link>
      </div>
    </section>
  );
}
