"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { PaginationControls } from "@/components/PaginationControls";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { useVendorOrderAlerts } from "@/contexts/VendorOrderAlertsContext";
import { useOrderSnapshotSounds } from "@/hooks/useOrderSnapshotSounds";
import { playNotificationSound } from "@/lib/sounds/playNotificationSound";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import {
  assignVendorOrderRider,
  fetchStoreAssignmentMode,
  getVendorAvailableRiders,
} from "@/services/vendorRiderAssignmentApi";
import { listVendorOrdersScopedPaginated, patchVendorOrderStatus } from "@/services/vendorMultiStoreApi";
import { OrderStatus } from "@/types/orderStatus";
import type { VendorOrderRow, VendorOrderStatus } from "@/types/vendorMultiStore";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

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

function badgeClass(s: VendorOrderStatus) {
  switch (s) {
    case "delivered":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "ready":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "in_transit":
      return "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200";
    case "assigned":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
    case "accepted":
      return "bg-blue-500/15 text-blue-800 dark:text-blue-200";
    case "delivery_failed":
      return "bg-rose-500/15 text-rose-800 dark:text-rose-200";
    case "cancelled":
      return "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400";
    default:
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }
}

function assignmentModeForOrder(row: VendorOrderRow, storeMode: "auto" | "manual" | undefined) {
  return row.assignmentMode ?? storeMode ?? "auto";
}

function formatStatusLabel(s: VendorOrderStatus): string {
  return s.replace(/_/g, " ");
}

type DatePreset = "today" | "last_7_days" | "last_30_days" | "custom";

function toIsoMaybe(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.trim() : d.toISOString();
}

export default function StoreOrdersPage() {
  const queryClient = useQueryClient();
  const { storeId } = useStoreDashboard();
  const [pickRider, setPickRider] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | VendorOrderStatus>("all");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [datePresetInput, setDatePresetInput] = useState<"" | DatePreset>("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [appliedOrderId, setAppliedOrderId] = useState("");
  const [appliedCustomerName, setAppliedCustomerName] = useState("");
  const [appliedDatePreset, setAppliedDatePreset] = useState<"" | DatePreset>("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const pageSize = 20;

  const ordersQ = useQuery({
    queryKey: [
      ...dashboardStoreKeys.orders(storeId),
      "page",
      page,
      "status",
      statusFilter,
      "orderId",
      appliedOrderId,
      "customerName",
      appliedCustomerName,
      "datePreset",
      appliedDatePreset,
      "fromDate",
      appliedFromDate,
      "toDate",
      appliedToDate,
    ],
    queryFn: () =>
      listVendorOrdersScopedPaginated(storeId, {
        limit: pageSize,
        page,
        status: statusFilter === "all" ? undefined : statusFilter,
        orderId: appliedOrderId || undefined,
        customerName: appliedCustomerName || undefined,
        datePreset: appliedDatePreset || undefined,
        fromDate: appliedFromDate || undefined,
        toDate: appliedToDate || undefined,
      }),
    refetchInterval: 12_000,
  });

  useOrderSnapshotSounds(
    ordersQ.data?.items.map((o) => ({ id: o.id, status: o.status })),
    ordersQ.data !== undefined,
    "vendor",
  );

  const pendingOrders = useMemo(
    () => (ordersQ.data?.items ?? []).filter((o) => o.status === "pending"),
    [ordersQ.data],
  );

  const { silenceRingingForNow, muted: vendorRingingMuted } = useVendorOrderAlerts();

  const assignmentModeQ = useQuery({
    queryKey: dashboardStoreKeys.assignmentMode(storeId),
    queryFn: () => fetchStoreAssignmentMode(storeId),
  });

  const ridersQ = useQuery({
    queryKey: dashboardStoreKeys.availableRiders(storeId),
    queryFn: () => getVendorAvailableRiders(storeId),
    enabled: assignmentModeQ.data === "manual",
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorOrderStatus }) =>
      patchVendorOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.orders(storeId) });
    },
    onError: (e) => {
      playNotificationSound("error");
      toast.error(getApiErrorMessage(e));
    },
  });

  const assignMut = useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      assignVendorOrderRider(orderId, riderId, storeId),
    onSuccess: () => {
      toast.success("Rider assigned");
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.orders(storeId) });
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.availableRiders(storeId) });
    },
    onError: (e) => {
      playNotificationSound("error");
      toast.error(getApiErrorMessage(e));
    },
  });

  const prevRidersFetchError = useRef(false);
  useEffect(() => {
    if (assignmentModeQ.data !== "manual") {
      prevRidersFetchError.current = false;
      return;
    }
    if (ridersQ.isError && !prevRidersFetchError.current) {
      playNotificationSound("error");
    }
    prevRidersFetchError.current = ridersQ.isError;
  }, [assignmentModeQ.data, ridersQ.isError]);

  const storeMode = assignmentModeQ.data;

  const showManualAssign = useMemo(() => storeMode === "manual", [storeMode]);
  const hasRows = (ordersQ.data?.items.length ?? 0) > 0;
  const customDateSelected = datePresetInput === "custom";

  function applyFilters() {
    setAppliedOrderId(orderIdInput.trim());
    setAppliedCustomerName(customerInput.trim());
    setAppliedDatePreset(datePresetInput);
    setAppliedFromDate(toIsoMaybe(fromDateInput));
    setAppliedToDate(toIsoMaybe(toDateInput));
    setPage(1);
  }

  function resetFilters() {
    setOrderIdInput("");
    setCustomerInput("");
    setDatePresetInput("");
    setFromDateInput("");
    setToDateInput("");
    setAppliedOrderId("");
    setAppliedCustomerName("");
    setAppliedDatePreset("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {pendingOrders.length > 0 ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-500/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-50 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-amber-50">
              {pendingOrders.length === 1
                ? "1 new order is pending"
                : `${pendingOrders.length} new orders are pending`}
            </p>
            <p className="mt-0.5 text-xs text-amber-100/85">
              Ringing repeats until you update status or stop sound for now.
              {vendorRingingMuted ? " Sound is paused; it will resume when another new pending order arrives." : null}
            </p>
          </div>
          <button
            type="button"
            onClick={silenceRingingForNow}
            className="shrink-0 rounded-xl border border-amber-400/50 bg-amber-900/40 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-900/60"
          >
            Stop ringing for now
          </button>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">Orders</h2>
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <label className="flex items-center gap-2 text-muted">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | VendorOrderStatus);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <input
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="Order ID / displayRef"
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            />
            <input
              value={customerInput}
              onChange={(e) => setCustomerInput(e.target.value)}
              placeholder="Customer name/email"
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            />
            <select
              value={datePresetInput}
              onChange={(e) => setDatePresetInput(e.target.value as "" | DatePreset)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">Date: Any</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 days</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
            {customDateSelected ? (
              <>
                <input
                  type="datetime-local"
                  value={fromDateInput}
                  onChange={(e) => setFromDateInput(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
                <input
                  type="datetime-local"
                  value={toDateInput}
                  onChange={(e) => setToDateInput(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </>
            ) : null}
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-lg bg-[#00A082] px-3 py-1.5 text-sm font-semibold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground"
            >
              Reset
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          Update preparation state, then assign a rider when the store uses manual assignment and the order
          is ready.
        </p>
        {assignmentModeQ.isSuccess ? (
          <p className="mt-2 text-xs text-muted">
            Store assignment mode:{" "}
            <span className="font-semibold text-foreground">
              {storeMode === "manual" ? "Manual" : "Auto"}
            </span>
            . Change it in{" "}
            <Link className="text-[#00A082] underline" href={`/dashboard/stores/${storeId}/settings`}>
              store settings
            </Link>
            .
          </p>
        ) : null}
      </div>

      {ordersQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/30" />
          ))}
        </div>
      ) : ordersQ.error ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-rose-600 dark:text-rose-400">
          {getApiErrorMessage(ordersQ.error)}
          {/* <p className="mt-2 text-xs text-muted">
            Implement <code className="font-mono">GET /vendor/orders</code> with{" "}
            <code className="font-mono">x-store-id</code> for live data.
          </p> */}
        </div>
      ) : !hasRows ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">
            {statusFilter === "all"
              ? "No orders for this store yet."
              : `No ${formatStatusLabel(statusFilter)} orders for this store.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/80">
                  <th className="px-4 py-3 font-semibold text-foreground">Customer</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Total</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Placed</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Details</th>
                  {showManualAssign ? (
                    <th className="px-4 py-3 font-semibold text-foreground">Assign rider</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(ordersQ.data?.items ?? []).map((o) => {
                  const mode = assignmentModeForOrder(o, storeMode);
                  const canAssign =
                    showManualAssign && mode === "manual" && o.status === "ready" && !o.riderId;
                  const selected = pickRider[o.id] ?? "";
                  return (
                    <tr key={o.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div>{o.customerLabel}</div>
                        {o.referenceCode ? (
                          <div className="text-xs text-muted">Ref {o.referenceCode}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(o.createdAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                              badgeClass(o.status),
                            )}
                          >
                            {formatStatusLabel(o.status)}
                          </span>
                          <select
                            value={o.status}
                            disabled={updateMut.isPending}
                            onChange={(e) => {
                              const next = e.target.value as VendorOrderStatus;
                              if (next !== o.status) updateMut.mutate({ id: o.id, status: next });
                            }}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {formatStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/stores/${storeId}/orders/${encodeURIComponent(o.id)}`}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-background"
                        >
                          View
                        </Link>
                      </td>
                      {showManualAssign ? (
                        <td className="px-4 py-3">
                          {canAssign ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={selected}
                                disabled={ridersQ.isLoading || assignMut.isPending}
                                onChange={(e) =>
                                  setPickRider((m) => ({ ...m, [o.id]: e.target.value }))
                                }
                                className="min-w-[10rem] rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
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
                                disabled={!selected || assignMut.isPending}
                                onClick={() => {
                                  if (!selected) return;
                                  assignMut.mutate({ orderId: o.id, riderId: selected });
                                }}
                                className="rounded-lg bg-[#00A082] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Assign
                              </button>
                            </div>
                          ) : o.riderId ? (
                            <span className="text-xs text-muted">Rider {o.riderId.slice(0, 8)}…</span>
                          ) : mode === "auto" ? (
                            <span className="text-xs text-muted">Auto</span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={ordersQ.data?.meta.page ?? 1}
            totalPages={ordersQ.data?.meta.totalPages ?? 1}
            totalItems={ordersQ.data?.meta.total}
            onPageChange={setPage}
            busy={ordersQ.isFetching}
            alwaysShow
          />
        </div>
      )}
    </div>
  );
}
