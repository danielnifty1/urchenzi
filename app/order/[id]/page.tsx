"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderStatusTracker } from "@/components/OrderStatusTracker";
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
      <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        Order not found.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Track order #{order.id}</h1>
        <p className="text-sm text-muted">Status updates are simulated in real-time.</p>
      </header>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2">
        <OrderStatusTracker status={status} />
        <div className="space-y-2 text-sm text-foreground">
          <p>
            <span className="font-semibold">Address:</span> {order.address}
          </p>
          <p>
            <span className="font-semibold">Payment:</span> {order.paymentMethod}
          </p>
          <p>
            <span className="font-semibold">Total:</span> {formatCurrency(order.total)}
          </p>
          <p>
            <span className="font-semibold">Rider:</span> {order.rider.name} ({order.rider.vehicle})
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {order.rider.phone}
          </p>
        </div>
      </div>
    </section>
  );
}
