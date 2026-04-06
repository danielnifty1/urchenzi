"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCreateOrder } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cartStore";
import { Order } from "@/types";
import { formatCurrency } from "@/utils/format";
import { savedAddresses } from "@/services/mockData";

const statuses: Order["status"][] = [
  "Pending",
  "Accepted",
  "Rider Assigned",
  "On the way",
  "Delivered",
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const [address, setAddress] = useState(savedAddresses[0]?.address || "");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const createOrder = useCreateOrder();

  const deliveryFee = 2.5;
  const discount = appliedPromo ? subtotal * 0.1 : 0;
  const total = subtotal + deliveryFee - discount;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!address.trim() || items.length === 0) {
      toast.error("Please select address and add cart items.");
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const order: Order = {
      id: orderId,
      items,
      total,
      status: statuses[0],
      address,
      paymentMethod,
      createdAt: new Date().toISOString(),
      rider: {
        name: "Ali Musa",
        phone: "+1 202 555 0125",
        vehicle: "Motorbike",
      },
    };

    await createOrder.mutateAsync(order);
    clearCart();
    toast.success("Order placed successfully!");
    router.push(`/order/${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-5xl">🛒</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Cart is Empty</h1>
          <p className="text-muted mb-6">Add items from vendors to get started</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition"
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
        <h1 className="text-4xl font-bold mb-2">Order Summary</h1>
        <p className="text-white/80">Review and complete your order</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-surface p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">📍 Delivery Address</h2>
            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setAddress(addr.address)}
                  className={`w-full text-left rounded-lg p-4 border-2 transition ${
                    address === addr.address
                      ? "border-brand bg-brand/5"
                      : "border-border hover:border-brand"
                  }`}
                >
                  <div className="font-semibold text-foreground">{addr.label}</div>
                  <div className="text-sm text-muted">{addr.address}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">💳 Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["Cash", "Card"] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-lg p-3 border-2 font-semibold transition ${
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

          <div className="rounded-2xl bg-surface p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">🎟️ Promo Code</h2>
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
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark transition"
              >
                Apply
              </button>
            </div>
            {appliedPromo && (
              <p className="text-sm text-success font-semibold mt-2">✓ Promo applied: {appliedPromo}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 border border-border h-fit sticky top-24">
          <h2 className="text-xl font-bold text-foreground mb-4">Order Items</h2>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm pb-2 border-b border-border">
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
            {discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span className="font-medium">Discount ({appliedPromo})</span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={createOrder.isPending}
            className="w-full mt-6 rounded-lg bg-brand px-4 py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition"
          >
            {createOrder.isPending ? "Processing..." : "Place Order"}
          </button>

          <Link
            href="/cart"
            className="block w-full mt-3 rounded-lg border-2 border-border px-4 py-3 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
