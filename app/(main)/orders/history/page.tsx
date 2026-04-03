"use client";

import Link from "next/link";
import { useState } from "react";

interface OrderHistory {
  id: string;
  vendor: string;
  date: string;
  total: number;
  status: "Delivered" | "Cancelled";
  items: number;
}

export default function OrderHistoryPage() {
  const [orders] = useState<OrderHistory[]>([
    {
      id: "ord1",
      vendor: "Pizza Hub",
      date: "Dec 15, 2024",
      total: 35.99,
      status: "Delivered",
      items: 3,
    },
    {
      id: "ord2",
      vendor: "Green Basket",
      date: "Dec 14, 2024",
      total: 28.5,
      status: "Delivered",
      items: 5,
    },
    {
      id: "ord3",
      vendor: "MediQuick",
      date: "Dec 12, 2024",
      total: 15.99,
      status: "Delivered",
      items: 2,
    },
    {
      id: "ord4",
      vendor: "Burger Station",
      date: "Dec 10, 2024",
      total: 42.0,
      status: "Delivered",
      items: 4,
    },
  ]);

  const [filter, setFilter] = useState<"all" | "delivered" | "cancelled">("all");

  const filtered = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-brand p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Order History</h1>
        <p className="text-white/80">View your past orders and reorder favorites</p>
      </div>

      <div className="rounded-2xl bg-surface p-6 border border-border">
        <div className="flex gap-2 mb-6">
          {(["all", "delivered", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition ${
                filter === f
                  ? "bg-brand text-white"
                  : "bg-background text-foreground hover:bg-border"
              }`}
            >
              {f === "all" && "All Orders"}
              {f === "delivered" && "✓ Delivered"}
              {f === "cancelled" && "✗ Cancelled"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-4xl mb-2">📦</p>
            <p className="font-semibold text-foreground">No orders yet</p>
            <p className="text-sm text-muted mt-1">Start ordering from your favorite vendors</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark transition"
            >
              Browse Vendors
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-brand hover:bg-background transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🏪</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground">{order.vendor}</h3>
                      <p className="text-sm text-muted">{order.items} items • {order.date}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${order.total.toFixed(2)}</p>
                  <p className={`text-sm font-semibold ${
                    order.status === "Delivered" ? "text-success" : "text-error"
                  }`}>
                    {order.status === "Delivered" ? "✓ Delivered" : "✗ Cancelled"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">Spending Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Spent", value: `$${filtered.reduce((sum, o) => sum + o.total, 0).toFixed(2)}` },
            { label: "Orders", value: filtered.length.toString() },
            { label: "Average Order", value: filtered.length > 0 ? `$${(filtered.reduce((sum, o) => sum + o.total, 0) / filtered.length).toFixed(2)}` : "$0" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-background p-4 text-center border border-border"
            >
              <p className="text-sm text-muted font-semibold uppercase mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-brand">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
