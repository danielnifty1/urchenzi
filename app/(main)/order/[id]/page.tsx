"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DeliveryTimeline } from "@/components/DeliveryTimeline";
import { RiderCard } from "@/components/RiderCard";
import { useOrder } from "@/hooks/useMarketplace";
import { OrderStatus } from "@/types";
import { formatCurrency } from "@/utils/format";

const flow: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Rider Assigned",
  "On the way",
  "Delivered",
];

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(id);
  const [status, setStatus] = useState<OrderStatus>("Pending");

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    const timer = setInterval(() => {
      setStatus((current) => {
        const index = flow.indexOf(current);
        if (index === flow.length - 1) {
          clearInterval(timer);
          return current;
        }
        return flow[index + 1];
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [order]);

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-background" />;
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-error">
          Order not found.
        </div>
        <Link
          href="/"
          className="inline-block rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Order #{order.id}</h1>
        <p className="text-white/80">Real-time delivery tracking and updates</p>
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Delivery Status</h2>
        <DeliveryTimeline currentStatus={status} estimatedTime="15 minutes" />
      </div>

      {status !== "Pending" && (
        <div className="rounded-2xl bg-surface p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Rider</h2>
          <RiderCard rider={order.rider} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Delivery Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted font-semibold">Delivery Address</p>
              <p className="text-foreground">{order.address}</p>
            </div>
            <div>
              <p className="text-muted font-semibold">Payment Method</p>
              <p className="text-foreground">{order.paymentMethod}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm border-b border-border pb-3 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted">{item.name} x{item.quantity}</span>
                <span className="font-semibold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span className="text-foreground">Total</span>
            <span className="text-brand">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-6 border border-border flex flex-col sm:flex-row gap-4">
        <button className="flex-1 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition">
          📞 Contact Support
        </button>
        <Link
          href="/orders/history"
          className="flex-1 rounded-lg border-2 border-border px-6 py-3 text-center font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition"
        >
          📋 View All Orders
        </Link>
      </div>
    </section>
  );
}
