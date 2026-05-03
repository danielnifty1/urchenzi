"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { createCustomerOrder } from "@/services/customerOrdersApi";
import { useCartStore } from "@/store/cartStore";
import { useLocationStore } from "@/store/locationStore";
import { useUserStore } from "@/store/userStore";
import { formatCurrency } from "@/utils/format";

export default function CheckoutPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  /** Same selection as Navbar `LocationSelector` (persisted). */
  const selectedAddress = useLocationStore((s) => s.selectedAddress);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  /** Display only — server computes fees on POST /customers/orders. */
  const deliveryFee = 2.5;
  const total = subtotal + deliveryFee;

  const placeOrderMut = useMutation({
    mutationFn: createCustomerOrder,
    onSuccess: (order) => {
      clearCart();
      const ref = order.displayRef || order.id;
      toast.success("Order placed successfully!");
      router.push(`/order/${encodeURIComponent(ref)}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  useEffect(() => {
    if (!authResolved) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (user.role && user.role !== "customer") {
      return;
    }
    if (!isProfileComplete(user)) {
      router.replace(profileCompletionPath("/checkout", "customer"));
    }
  }, [authResolved, user, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error("Please sign in to place an order.");
      return;
    }
    if (user.role && user.role !== "customer") {
      toast.error("Checkout is only available for customer accounts.");
      return;
    }
    if (!isProfileComplete(user)) {
      router.replace(profileCompletionPath("/checkout", "customer"));
      return;
    }
    if (!selectedAddress.address.trim() || items.length === 0) {
      toast.error("Please select address and add cart items.");
      return;
    }

    const storeId = items[0]?.vendorId?.trim();
    if (!storeId) {
      toast.error("Missing store — add items from a store and try again.");
      return;
    }

    placeOrderMut.mutate({
      storeId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      address: {
        label: selectedAddress.label,
        line: selectedAddress.address.trim(),
      },
      paymentMethod: paymentMethod === "Cash" ? "cash" : "card",
    });
  };

  if (!authResolved) {
    return (
      <div className="py-16 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (user && user.role && user.role !== "customer") {
    return (
      <div className="space-y-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted">Customer checkout isn&apos;t available for this account type.</p>
        <Link href="/" className="inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-white">
          Back to home
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="text-5xl">🛒</div>
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Cart is Empty</h1>
          <p className="mb-6 text-muted">Add items from vendors to get started</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-brand p-8 text-white">
        <h1 className="mb-2 text-4xl font-bold">Order Summary</h1>
        <p className="text-white/80">Review and complete your order</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">📍 Delivery address</h2>
            <p className="mb-4 text-sm text-muted">
              Orders are sent to the address you select in the <strong className="text-foreground">navbar</strong>{" "}
              (📍 location). Change it there anytime before you place the order.
            </p>
            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Deliver to</p>
              <p className="mt-1 font-semibold text-foreground">{selectedAddress.label}</p>
              <p className="mt-0.5 text-sm text-muted">{selectedAddress.address}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold text-foreground">💳 Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["Cash", "Card"] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-lg border-2 p-3 font-semibold transition ${
                    paymentMethod === method
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-border text-foreground hover:border-brand"
                  }`}
                >
                  {method === "Cash" ? "💵" : "💳"} {method}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold text-foreground">🎟️ Promo Code</h2>
            <div className="flex gap-3">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setAppliedPromo(promoCode || null)}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
              >
                Apply
              </button>
            </div>
            {appliedPromo && (
              <p className="mt-2 text-sm font-semibold text-success">✓ Promo applied: {appliedPromo}</p>
            )}
          </div>
        </div>

        <div className="sticky top-24 h-fit rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">Order Items</h2>
          <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-border pb-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">x{item.quantity}</p>
                </div>
                <p className="font-semibold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery fee</span>
              <span className="font-medium">{formatCurrency(deliveryFee)}</span>
            </div>
            {appliedPromo ? (
              <p className="text-xs text-muted">Promo &quot;{appliedPromo}&quot; — applied when supported by checkout API.</p>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={placeOrderMut.isPending}
            className="mt-6 w-full rounded-lg bg-brand px-4 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {placeOrderMut.isPending ? "Placing order…" : "Place order"}
          </button>

          <Link
            href="/cart"
            className="mt-3 block w-full rounded-lg border-2 border-border px-4 py-3 text-center font-semibold text-foreground transition hover:border-brand hover:bg-brand/5"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
