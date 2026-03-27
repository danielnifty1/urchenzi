"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCreateOrder } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cartStore";
import { Order } from "@/types";
import { formatCurrency } from "@/utils/format";

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
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const createOrder = useCreateOrder();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!address.trim() || items.length === 0) {
      toast.error("Please add address and cart items.");
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const order: Order = {
      id: orderId,
      items,
      total: subtotal,
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
    toast.success("Order placed successfully.");
    router.push(`/order/${orderId}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        <label className="block text-sm font-medium">Delivery address</label>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Enter your address"
          required
        />
      </div>
      <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-medium">Payment method</p>
        <div className="flex gap-3">
          {(["Cash", "Card"] as const).map((method) => (
            <button
              type="button"
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`rounded-full px-4 py-2 text-sm ${
                paymentMethod === method
                  ? "bg-brand-strong text-white"
                  : "bg-background text-foreground"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex justify-between text-sm">
          <span>Order total</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <button
          type="submit"
          disabled={createOrder.isPending}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-[#10131a] disabled:opacity-50"
        >
          {createOrder.isPending ? "Placing order..." : "Place order"}
        </button>
      </div>
    </form>
  );
}
