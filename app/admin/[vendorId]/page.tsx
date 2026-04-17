"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  adminVendorApprove,
  adminVendorBan,
  adminVendorDashboard,
  adminVendorGetById,
  adminVendorListStores,
  adminVendorReject,
  adminVendorReinstate,
  adminVendorReinstateStore,
  adminVendorSuspend,
  adminVendorSuspendStore,
} from "@/services/adminVendorApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import {
  asRecord,
  getBool,
  getStr,
  humanizeKey,
  parseVendorDashboard,
  pickLinkedUserStatus,
  pickVendorApplicationSummary,
  pickVendorRecordStatus,
  pickVendorRejectionReason,
  vendorApplicationSummaryHasDetail,
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
const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function metricNum(metrics: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export default function AdminVendorOverviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vendorId = String(params.vendorId ?? "");
  const storeIdFromQuery = searchParams.get("storeId");
  const validStoreIdFromQuery =
    storeIdFromQuery && UUID_RE.test(storeIdFromQuery) ? storeIdFromQuery : null;
  const [fallbackStoreId, setFallbackStoreId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (validStoreIdFromQuery) return;
    if (typeof window === "undefined") return;
    const fromStorage = window.localStorage.getItem("active_store_id");
    setFallbackStoreId(fromStorage && UUID_RE.test(fromStorage) ? fromStorage : null);
  }, [validStoreIdFromQuery]);

  const storeId = validStoreIdFromQuery ?? fallbackStoreId ?? null;

  const vendorQ = useQuery({
    queryKey: ["admin-vendor", vendorId],
    queryFn: () => adminVendorGetById(vendorId),
    enabled: Boolean(vendorId),
  });

  const dashboardQ = useQuery({
    queryKey: ["admin-vendor-dashboard", vendorId, storeId],
    queryFn: () => adminVendorDashboard(vendorId, storeId as string),
    enabled: Boolean(vendorId && storeId),
  });

  const storesQ = useQuery({
    queryKey: ["admin-vendor-stores", vendorId],
    queryFn: () => adminVendorListStores(vendorId),
    enabled: Boolean(vendorId),
  });

  const invalidateVendorDashboard = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-vendor-dashboard", vendorId] });
  const invalidateVendor = () => void queryClient.invalidateQueries({ queryKey: ["admin-vendor", vendorId] });

  const invalidateDirectory = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-directory", "vendors"] });

  const approveMut = useMutation({
    mutationFn: () => adminVendorApprove(vendorId),
    onSuccess: () => {
      toast.success("Vendor approved.");
      invalidateVendor();
      invalidateVendorDashboard();
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
      invalidateVendorDashboard();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const suspendMut = useMutation({
    mutationFn: () => adminVendorSuspend(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner suspended.");
      invalidateVendor();
      invalidateVendorDashboard();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const banMut = useMutation({
    mutationFn: () => adminVendorBan(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner banned.");
      invalidateVendor();
      invalidateVendorDashboard();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const reinstateMut = useMutation({
    mutationFn: () => adminVendorReinstate(vendorId),
    onSuccess: () => {
      toast.success("Linked store owner reinstated (active).");
      invalidateVendor();
      invalidateVendorDashboard();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const invalidateVendorStores = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-vendor-stores", vendorId] });

  const suspendStoreMut = useMutation({
    mutationFn: (storeRowId: string) => adminVendorSuspendStore(storeRowId),
    onSuccess: () => {
      toast.success("Store suspended.");
      invalidateVendorStores();
      invalidateVendorDashboard();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const reinstateStoreMut = useMutation({
    mutationFn: (storeRowId: string) => adminVendorReinstateStore(storeRowId),
    onSuccess: () => {
      toast.success("Store reinstated.");
      invalidateVendorStores();
      invalidateVendorDashboard();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const modBusy = suspendMut.isPending || banMut.isPending || reinstateMut.isPending;
  const reviewBusy = approveMut.isPending || rejectMut.isPending;

  const storeRowBusy = (id: string) =>
    (suspendStoreMut.isPending && suspendStoreMut.variables === id) ||
    (reinstateStoreMut.isPending && reinstateStoreMut.variables === id);

  /** API sets status to `inactive` on suspend (see POST …/stores/:storeId/suspend). */
  const storeIsInactiveAfterSuspend = (status: string) => {
    const s = status.toLowerCase();
    return s === "inactive" || s === "suspended";
  };
  const storeCanAdminSuspend = (status: string) => status.toLowerCase() === "active";

  if (vendorQ.isLoading || (storeId && dashboardQ.isLoading)) {
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

  if (vendorQ.error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-red-200">
        {formatAdminError(vendorQ.error)}
      </div>
    );
  }
  const vendorRaw = asRecord(vendorQ.data);
  const { settings, features, metrics, raw: dashboardRaw } = dashboardQ.data
    ? parseVendorDashboard(dashboardQ.data)
    : parseVendorDashboard({});
  const raw = { ...vendorRaw, ...dashboardRaw };
  const ownerStatus = pickLinkedUserStatus(raw);
  const nestedVendor = asRecord(vendorRaw.vendor);
  const vendorStatusFallbackRaw =
    getStr(vendorRaw, "status", "status").toLowerCase().trim() ||
    getStr(nestedVendor, "status", "status").toLowerCase().trim();
  const moderationStatus = ownerStatus ?? (vendorStatusFallbackRaw || null);
  const canSuspendOwner = moderationStatus !== "suspended";
  const canBanOwner = moderationStatus !== "banned";
  const canReinstateOwner = moderationStatus === "suspended" || moderationStatus === "banned";
  const vendorRecordStatus = pickVendorRecordStatus(raw);
  const rejectionReason = pickVendorRejectionReason(raw);
  const applicationSummary = (() => {
    const s = pickVendorApplicationSummary(vendorRaw);
    return { ...s, vendorId: s.vendorId || vendorId };
  })();
  const storeName =
    getStr(settings, "storeName", "store_name") ||
    getStr(vendorRaw, "storeName", "store_name") ||
    getStr(vendorRaw, "businessName", "business_name") ||
    "Vendor";
  const tagline = getStr(settings, "tagline", "tag_line") || getStr(vendorRaw, "tagline", "tag_line");
  const slug =
    getStr(settings, "storeSlug", "store_slug") ||
    getStr(vendorRaw, "storeSlug", "store_slug") ||
    getStr(vendorRaw, "slug", "slug");
  const category = getStr(settings, "category", "category") || getStr(vendorRaw, "category", "category");
  const hasStoreDashboard = Boolean(storeId && dashboardQ.data);
  const isOpen = hasStoreDashboard ? getBool(settings, "isOpen", "is_open") : false;

  const metricEntries = Object.entries(metrics).filter(
    ([, v]) => typeof v === "number" && Number.isFinite(v),
  ) as [string, number][];
  const kpiProducts = metricNum(metrics, "productCount", "productsCount", "totalProducts", "total_products");
  const kpiOrders = metricNum(metrics, "ordersCount", "orderCount", "totalOrders", "total_orders");
  const kpiSales = metricNum(
    metrics,
    "sales",
    "salesTotal",
    "totalSales",
    "total_sales",
    "revenue",
    "totalRevenue",
    "total_revenue",
  );

  const featureEntries = Object.entries(features).filter(([, v]) => typeof v === "boolean") as [
    string,
    boolean,
  ][];

  const vendorApplicationDecided = vendorRecordStatus === "approved";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vendor record overview. Store dashboard metrics are shown when store context is selected.
        </p>
      </div>
      {!storeId ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 text-amber-100">
          <p className="font-semibold">No store selected yet</p>
          <p className="mt-1 text-sm">
            {/* Approve/reject works from vendor details  Add a */}
            {/* <code className="mx-1 font-mono">storeId</code>
            to load store dashboard, settings, and features. */}
          </p>
        </div>
      ) : null}
      {dashboardQ.error ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 text-amber-100">
          <p className="font-semibold">Store dashboard unavailable for selected store</p>
          <p className="mt-1 text-sm">{formatAdminError(dashboardQ.error)}</p>
        </div>
      ) : null}

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
                {hasStoreDashboard ? (isOpen ? "Open" : "Closed") : "No store context"}
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
              href={storeId ? `/admin/${vendorId}/settings?storeId=${storeId}` : `/admin/${vendorId}/settings`}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
            >
              View settings
            </Link>
            <Link
              href={storeId ? `/admin/${vendorId}/features?storeId=${storeId}` : `/admin/${vendorId}/features`}
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

      {hasStoreDashboard ? (
        <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Store KPIs</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Products" value={kpiProducts} accentIndex={0} />
            <StatCard label="Orders" value={kpiOrders} accentIndex={1} />
            <StatCard
              label="Sales"
              value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(kpiSales)}
              accentIndex={2}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Vendor application</h3>
          {vendorApplicationDecided ? (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              Approved
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {vendorApplicationDecided
            ? "Submitted details stay visible for support and audit. Approval actions are hidden because this vendor is already approved."
            : "Review the details below before approving or rejecting."}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Vendor ID</dt>
            <dd className="mt-0.5 font-mono text-sm text-zinc-300 break-all">{applicationSummary.vendorId}</dd>
          </div>
          {applicationSummary.legalBusinessName ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Legal / business name</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{applicationSummary.legalBusinessName}</dd>
            </div>
          ) : null}
          {applicationSummary.storeOrTradingName ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Store / trading name</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{applicationSummary.storeOrTradingName}</dd>
            </div>
          ) : null}
          {applicationSummary.contactEmail ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Contact email</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{applicationSummary.contactEmail}</dd>
            </div>
          ) : null}
          {applicationSummary.contactPhone ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{applicationSummary.contactPhone}</dd>
            </div>
          ) : null}
          {applicationSummary.businessAddress ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Business address</dt>
              <dd className="mt-0.5 text-sm text-zinc-200 whitespace-pre-wrap">{applicationSummary.businessAddress}</dd>
            </div>
          ) : null}
          {applicationSummary.category ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</dt>
              <dd className="mt-0.5 text-sm text-zinc-200 capitalize">{applicationSummary.category}</dd>
            </div>
          ) : null}
          {applicationSummary.submittedOrCreated ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Submitted / created</dt>
              <dd className="mt-0.5 text-sm text-zinc-200">{applicationSummary.submittedOrCreated}</dd>
            </div>
          ) : null}
        </dl>
        {!vendorApplicationSummaryHasDetail(applicationSummary) ? (
          <p className="mt-4 rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-500">
            No application fields were returned for this vendor. If you expected business and contact details here,
            confirm the admin vendor API includes onboarding or linked user data for{" "}
            <span className="font-mono text-zinc-400">{vendorId}</span>.
          </p>
        ) : null}
        {rejectionReason ? (
          <div className="mt-4 rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-300/80">Last rejection reason</p>
            <p className="mt-1 text-sm text-rose-100/90 whitespace-pre-wrap">{rejectionReason}</p>
          </div>
        ) : null}
        {!vendorApplicationDecided ? (
          <>
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
          </>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Stores</h3>
        <p className="mt-1 text-sm text-zinc-500">
          List from <span className="font-mono text-zinc-400">GET /admin/vendors/…/stores</span>. Suspend sets the store to{" "}
          <span className="text-zinc-400">inactive</span> and closes it to customers; it does not suspend the owner
          user (<span className="font-mono text-zinc-500">POST …/vendors/…/suspend</span>).
        </p>
        {storesQ.isLoading ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-zinc-900/80" />
        ) : storesQ.error ? (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-200">
            {formatAdminError(storesQ.error)}
          </div>
        ) : !storesQ.data?.length ? (
          <p className="mt-4 text-sm text-zinc-500">No stores returned for this vendor.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Id</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {storesQ.data.map((row) => {
                  const inactive = storeIsInactiveAfterSuspend(row.status);
                  const canSuspend = storeCanAdminSuspend(row.status);
                  return (
                    <tr key={row.id} className="hover:bg-zinc-900/40">
                      <td className="px-4 py-3 font-medium text-zinc-200">{row.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            inactive ? "bg-amber-500/20 text-amber-200" : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-500" title={row.id}>
                        {row.id}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/${vendorId}?storeId=${encodeURIComponent(row.id)}`}
                            className="text-xs font-medium text-emerald-500 hover:underline"
                          >
                            Set context
                          </Link>
                          {inactive ? (
                            <button
                              type="button"
                              disabled={storeRowBusy(row.id)}
                              onClick={() => {
                                if (!window.confirm("Reinstate this store? It can operate again per your platform rules."))
                                  return;
                                reinstateStoreMut.mutate(row.id);
                              }}
                              className="rounded-lg border border-emerald-600/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-50"
                            >
                              Reinstate store
                            </button>
                          ) : canSuspend ? (
                            <button
                              type="button"
                              disabled={storeRowBusy(row.id)}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    "Suspend this store? Status becomes inactive and the store closes to customers; the owner account is not changed.",
                                  )
                                )
                                  return;
                                suspendStoreMut.mutate(row.id);
                              }}
                              className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-950/50 disabled:opacity-50"
                            >
                              Suspend store
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Store owner moderation</h3>
        {/* <p className="mt-1 text-sm text-zinc-500">
          POST endpoints update the linked user&apos;s <code className="text-zinc-400">UserStatus</code> (suspend /
          ban / reinstate). Vendor dashboard APIs require an active owner.
        </p> */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Owner status</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(moderationStatus)}`}
          >
            {moderationStatus ?? "Unknown"}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={modBusy || !canSuspendOwner}
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
            disabled={modBusy || !canBanOwner}
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
            disabled={modBusy || !canReinstateOwner}
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
