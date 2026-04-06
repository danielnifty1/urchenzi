"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCartStore } from "@/store/cartStore";

type CartSidebarProps = {
  vendorId: string;
  storeClosed: boolean;
  storeName: string;
};

export function CartSidebar({ vendorId, storeClosed, storeName }: CartSidebarProps) {
  // Select `items` only — `.filter()` in a selector returns a new array every run and
  // breaks Zustand’s `Object.is` check, causing an infinite re-render loop.
  const cartItems = useCartStore((s) => s.items);
  const items = useMemo(
    () => cartItems.filter((i) => i.vendorId === vendorId),
    [cartItems, vendorId],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const empty = items.length === 0;

  return (
    <aside className="sticky top-[72px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-md">
      <h2 className="text-center text-lg font-bold text-foreground">Your order</h2>

      {storeClosed ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="mb-4 text-5xl opacity-40" aria-hidden>
            🏬
          </div>
          <p className="text-sm font-medium text-muted">Temporarily closed</p>
          <p className="mt-2 text-xs text-muted">
            {storeName} is not taking orders right now.
          </p>
        </div>
      ) : empty ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="mb-4 text-5xl opacity-40" aria-hidden>
            🛒
          </div>
          <p className="text-sm font-medium text-muted">No items yet</p>
          <p className="mt-2 text-xs text-muted">Add products from the menu.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2 border-b border-border pb-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium line-clamp-2">{item.name}</p>
                <p className="text-muted">
                  ₦{item.price.toLocaleString("en-NG")} × {item.quantity}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="text-xs text-error hover:underline"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
                <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1">
                  <button
                    type="button"
                    className="px-2 py-0.5"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-[1.25rem] text-center text-xs">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-2 py-0.5"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </li>
          ))}
          <li className="flex justify-between pt-2 font-semibold">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString("en-NG")}</span>
          </li>
          <li>
            <Link
              href="/checkout"
              className="mt-2 block w-full rounded-full bg-[#00A082] py-3 text-center text-sm font-semibold text-white hover:opacity-95"
            >
              Checkout
            </Link>
          </li>
        </ul>
      )}
    </aside>
  );
}
