"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { RiderCard } from "@/components/RiderCard";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import {
  assignVendorOrderRider,
  fetchStoreAssignmentMode,
  getVendorAvailableRiders,
} from "@/services/vendorRiderAssignmentApi";
import { getScopedOrderDetails, patchVendorOrderStatus } from "@/services/vendorMultiStoreApi";
import { OrderStatus } from "@/types/orderStatus";
import type { VendorOrderStatus } from "@/types/vendorMultiStore";
import { formatCurrency } from "@/utils/format";

const STATUS_OPTIONS: VendorOrderStatus[] = [
  OrderStatus.Pending,
  OrderStatus.Accepted,
  OrderStatus.Ready,
  OrderStatus.Assigned,
  OrderStatus.InTransit,
  OrderStatus.Delivered,
  OrderStatus.DeliveryFailed,
  OrderStatus.Cancelled,
];

function formatStatusLabel(s: VendorOrderStatus): string {
  return s.replace(/_/g, " ");
}

export default function StoreOrderDetailsPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ storeId: string; orderId: string }>();
  const storeId = String(params.storeId ?? "");
  const orderId = String(params.orderId ?? "");
  const [selectedRiderId, setSelectedRiderId] = useState("");

  const orderQ = useQuery({
    queryKey: ["store-order-details", storeId, orderId],
    queryFn: () => getScopedOrderDetails(orderId, storeId),
    enabled: Boolean(storeId && orderId),
  });

  const updateMut = useMutation({
    mutationFn: (status: VendorOrderStatus) => patchVendorOrderStatus(orderId, status),
    onSuccess: async () => {
      toast.success("Order updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["store-order-details", storeId, orderId] }),
        queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.orders(storeId) }),
      ]);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e));
    },
  });

  const assignmentModeQ = useQuery({
    queryKey: dashboardStoreKeys.assignmentMode(storeId),
    queryFn: () => fetchStoreAssignmentMode(storeId),
    enabled: Boolean(storeId),
  });

  const ridersQ = useQuery({
    queryKey: dashboardStoreKeys.availableRiders(storeId),
    queryFn: () => getVendorAvailableRiders(storeId),
    enabled: Boolean(storeId) && assignmentModeQ.data === "manual",
  });

  const assignMut = useMutation({
    mutationFn: (riderId: string) => assignVendorOrderRider(orderId, riderId, storeId),
    onSuccess: async () => {
      toast.success("Rider assigned");
      setSelectedRiderId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["store-order-details", storeId, orderId] }),
        queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.orders(storeId) }),
        queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.availableRiders(storeId) }),
      ]);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e));
    },
  });

  if (orderQ.isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-background" />;
  }

  if (orderQ.isError || !orderQ.data) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        {getApiErrorMessage(orderQ.error)}
      </div>
    );
  }

  const order = orderQ.data;
  const effectiveAssignmentMode = order.assignmentMode ?? assignmentModeQ.data ?? "auto";
  const canAssignRider =
    effectiveAssignmentMode === "manual" && order.status === "ready" && !order.rider?.id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Order {order.displayRef ?? order.id}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Full order snapshot at checkout, including items, payment and delivery details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Order details</h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="flex items-center gap-2">
                <span className="font-medium capitalize text-foreground">
                  {order.status.replace(/_/g, " ")}
                </span>
                <select
                  value={order.status}
                  disabled={updateMut.isPending}
                  onChange={(e) => {
                    const next = e.target.value as VendorOrderStatus;
                    if (next !== order.status) updateMut.mutate(next);
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs capitalize text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {formatStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Payment status</dt>
              <dd className="font-medium capitalize text-foreground">{order.paymentStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Payment method</dt>
              <dd className="font-medium capitalize text-foreground">{order.paymentMethod ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Assignment mode</dt>
              <dd className="font-medium capitalize text-foreground">{effectiveAssignmentMode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Created</dt>
              <dd className="font-medium text-foreground">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Updated</dt>
              <dd className="font-medium text-foreground">
                {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">IDs</h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Order ID</dt>
              <dd className="font-mono text-xs text-foreground">{order.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Customer</dt>
              <dd className="text-foreground">{order.customerName ?? order.customerId ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Vendor</dt>
              <dd className="text-foreground">{order.vendorName ?? order.vendorId ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Store</dt>
              <dd className="text-foreground">{order.storeName ?? order.storeId ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Line items</h3>
        {order.items.length ? (
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((item, idx) => (
              <li key={item.id ?? `${item.productId}-${idx}`} className="flex justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold text-foreground">{formatCurrency(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No line items found.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Totals</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Delivery fee</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Service fee</span>
            <span>{formatCurrency(order.serviceFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Delivery</h3>
        <p className="mt-3 text-sm text-foreground">
          {order.deliveryLabel ? `${order.deliveryLabel}: ` : ""}
          {order.deliveryAddressLine ?? "—"}
        </p>
        {(order.deliveryLat != null || order.deliveryLng != null) && (
          <p className="mt-1 font-mono text-xs text-muted">
            {order.deliveryLat ?? "—"}, {order.deliveryLng ?? "—"}
          </p>
        )}
      </section>

      {order.rider ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Rider</h3>
          <RiderCard
            rider={{
              name: order.rider.fullName ?? "Assigned rider",
              phone: order.rider.phone ?? "—",
              vehicle: order.rider.vehicleType ?? "Delivery",
            }}
          />
        </section>
      ) : canAssignRider ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Assign rider</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRiderId}
              disabled={ridersQ.isLoading || assignMut.isPending}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              className="min-w-[14rem] rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="">Select rider…</option>
              {(ridersQ.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName ?? r.id.slice(0, 8)}
                  {r.dispatchStatus ? ` (${r.dispatchStatus})` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedRiderId || assignMut.isPending}
              onClick={() => {
                if (!selectedRiderId) return;
                assignMut.mutate(selectedRiderId);
              }}
              className="rounded-lg bg-[#00A082] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Assign
            </button>
          </div>
          {ridersQ.isError ? (
            <p className="mt-2 text-xs text-rose-400">{getApiErrorMessage(ridersQ.error)}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
