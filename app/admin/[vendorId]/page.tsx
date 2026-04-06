"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  adminVendorApprove,
  adminVendorBan,
  adminVendorDashboard,
  adminVendorReject,
  adminVendorReinstate,
  adminVendorSuspend,
} from "@/services/adminVendorApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import {
  getBool,
  getStr,
  humanizeKey,
  parseVendorDashboard,
  pickLinkedUserStatus,
  pickVendorRecordStatus,
  pickVendorRejectionReason,
  VENDOR_FEATURE_META,
} from "@/lib/admin/vendorWorkspace";

const metricAccents = ["emerald", "sky", "violet", "amber", "rose", "cyan"] as const;

function StatCard({
  label,
  value,
  accentIndex,
}: {
  label: string;
  value: string | number;
  accentIndex: number;
}) {
  const ring = [
    "from-emerald-500/15 to-transparent ring-emerald-500/20",
    "from-sky-500/15 to-transparent ring-sky-500/20",
    "from-violet-500/15 to-transparent ring-violet-500/20",
    "from-amber-500/15 to-transparent ring-amber-500/20",
    "from-rose-500/15 to-transparent ring-rose-500/20",
    "from-cyan-500/15 to-transparent ring-cyan-500/20",
  ][accentIndex % 6];

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${ring} p-5 ring-1 ring-inset`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function statusBadgeClass(status: string | null): string {
  if (!status) return "bg-zinc-700 text-zinc-400";
  if (status === "active") return "bg-emerald-500/20 text-emerald-300";
  if (status === "suspended") return "bg-amber-500/20 text-amber-200";
  if (status === "banned") return "bg-red-500/20 text-red-300";
  return "bg-zinc-700 text-zinc-300";
}

function vendorRecordBadgeClass(status: string | null): string {
  if (!status) return "bg-zinc-700 text-zinc-400";
  if (status === "approved") return "bg-emerald-500/20 text-emerald-300";
  if (status === "pending") return "bg-amber-500/20 text-amber-200";
  if (status === "rejected") return "bg-rose-500/20 text-rose-200";
  return "bg-zinc-700 text-zinc-300";
}

const REJECT_REASON_MAX = 2000;

export default function AdminVendorOverviewPage() {
  const params = useParams();
  const vendorId = String(params.vendorId ?? "");
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-vendor-dashboard", vendorId],
    queryFn: () => adminVendorDashboard(vendorId),
    enabled: Boolean(vendorId),
  });

  const invalidateVendor = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-vendor-dashboard", vendorId] });

  const invalidateDirectory = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-directory", "vendors"] });

  const approveMut = useMutation({
    mutationFn: () => adminVendorApprove(vendorId),
    onSuccess: () => {
      toast.success("Vendor approved.");
      invalidateVendor();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      adminVendorReject(
        vendorId,
        rejectReason.trim() ? { reason: rejectReason.trim() } : {},
      ),
    onSuccess: () => {
      toast.success("Vendor rejected (pending).");
      setRejectOpen(false);
      setRejectReason("");
      invalidateVendor();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const suspendMut = useMutation({
    mutationFn: () => adminVendorSuspend(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner suspended.");
      invalidateVendor();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const banMut = useMutation({
    mutationFn: () => adminVendorBan(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner banned.");
      invalidateVendor();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const reinstateMut = useMutation({
    mutationFn: () => adminVendorReinstate(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner reinstated (active).");
      invalidateVendor();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const modBusy = suspendMut.isPending || banMut.isPending || reinstateMut.isPending;
  const reviewBusy = approveMut.isPending || rejectMut.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-zinc-900" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-red-200">
        {formatAdminError(error)}
      </div>
    );
  }

  const { settings, features, metrics, raw } = parseVendorDashboard(data);
  const ownerStatus = pickLinkedUserStatus(raw);
  const vendorRecordStatus = pickVendorRecordStatus(raw);
  const rejectionReason = pickVendorRejectionReason(raw);
  const storeName = getStr(settings, "storeName", "store_name") || "Store";
  const tagline = getStr(settings, "tagline", "tag_line");
  const slug = getStr(settings, "storeSlug", "store_slug");
  const category = getStr(settings, "category", "category");
  const isOpen = getBool(settings, "isOpen", "is_open");

  const metricEntries = Object.entries(metrics).filter(
    ([, v]) => typeof v === "number" && Number.isFinite(v),
  ) as [string, number][];

  const featureEntries = Object.entries(features).filter(([, v]) => typeof v === "boolean") as [
    string,
    boolean,
  ][];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Store snapshot from the vendor dashboard API</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-zinc-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isOpen ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {isOpen ? "Open" : "Closed"}
              </span>
              {category ? (
                <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {category}
                </span>
              ) : null}
              {vendorRecordStatus ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${vendorRecordBadgeClass(vendorRecordStatus)}`}
                >
                  {vendorRecordStatus}
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{storeName}</h2>
            {tagline ? <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{tagline}</p> : null}
            {slug ? (
              <p className="font-mono text-xs text-zinc-500">
                /<span className="text-emerald-500/90">{slug}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <Link
              href={`/admin/${vendorId}/settings`}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
            >
              View settings
            </Link>
            <Link
              href={`/admin/${vendorId}/features`}
              className="rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-2.5 text-center text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Feature flags
            </Link>
            <Link
              href={`/admin/${vendorId}/products`}
              className="rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-2.5 text-center text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Products
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Vendor application</h3>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-mono text-zinc-400">POST …/approve</span> sets the vendor to approved and clears
          onboarding rejection when a row exists. <span className="font-mono text-zinc-400">POST …/reject</span> sets
          the vendor to pending and marks onboarding rejected; optional reason (max {REJECT_REASON_MAX} chars).
        </p>
        {rejectionReason ? (
          <div className="mt-4 rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-300/80">Last rejection reason</p>
            <p className="mt-1 text-sm text-rose-100/90 whitespace-pre-wrap">{rejectionReason}</p>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={reviewBusy}
            onClick={() => {
              if (!window.confirm("Approve this vendor? Status becomes approved; onboarding cleared if present."))
                return;
              approveMut.mutate();
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Approve vendor
          </button>
          <button
            type="button"
            disabled={reviewBusy}
            onClick={() => setRejectOpen((o) => !o)}
            className="rounded-xl border border-rose-600/50 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-950/50 disabled:opacity-50"
          >
            {rejectOpen ? "Cancel reject" : "Reject…"}
          </button>
        </div>
        {rejectOpen ? (
          <div className="mt-4 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <label className="block text-sm font-medium text-zinc-400" htmlFor="reject-reason">
              Reason (optional)
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value.slice(0, REJECT_REASON_MAX))}
              rows={4}
              placeholder="Explain why the application is rejected…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">
                {rejectReason.length}/{REJECT_REASON_MAX}
              </span>
              <button
                type="button"
                disabled={reviewBusy}
                onClick={() => rejectMut.mutate()}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {rejectMut.isPending ? "Submitting…" : "Submit rejection"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Store owner moderation</h3>
        <p className="mt-1 text-sm text-zinc-500">
          POST endpoints update the linked user&apos;s <code className="text-zinc-400">UserStatus</code> (suspend /
          ban / reinstate). Vendor dashboard APIs require an active owner.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Owner status</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(ownerStatus)}`}
          >
            {ownerStatus ?? "Unknown"}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={modBusy}
            onClick={() => {
              if (!window.confirm("Suspend the linked store owner? They will get 403 on vendor APIs until reinstated."))
                return;
              suspendMut.mutate();
            }}
            className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-950/60 disabled:opacity-50"
          >
            Suspend owner
          </button>
          <button
            type="button"
            disabled={modBusy}
            onClick={() => {
              if (
                !window.confirm(
                  "Ban the linked store owner? This is a strong restriction; confirm with your policy.",
                )
              )
                return;
              banMut.mutate();
            }}
            className="rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-950/50 disabled:opacity-50"
          >
            Ban owner
          </button>
          <button
            type="button"
            disabled={modBusy}
            onClick={() => {
              reinstateMut.mutate();
            }}
            className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-50"
          >
            Reinstate (active)
          </button>
        </div>
      </section>

      {metricEntries.length > 0 ? (
        <div>
          <h3 className="mb-4 text-sm font-medium text-zinc-400">Metrics</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricEntries.map(([key, value], i) => (
              <StatCard key={key} label={humanizeKey(key)} value={value} accentIndex={i} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No numeric metrics in this response.</p>
      )}

      {featureEntries.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium text-zinc-400">Features</h3>
            <Link href={`/admin/${vendorId}/features`} className="text-xs font-medium text-emerald-500 hover:underline">
              View
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {featureEntries.map(([key, on]) => {
              const meta = VENDOR_FEATURE_META[key];
              const label = meta?.label ?? humanizeKey(key);
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    on
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                  }`}
                  title={meta?.description}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
