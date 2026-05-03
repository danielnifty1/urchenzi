"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  adminRiderApprove,
  adminRiderBan,
  adminRiderReject,
  adminRiderReinstate,
  adminRiderSuspend,
  fetchAdminRiderById,
} from "@/services/adminRiderApi";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { asRecord, getBool, getStr, pickLinkedUserStatus } from "@/lib/admin/vendorWorkspace";

const REJECT_REASON_MAX = 2000;

function statusBadgeClass(status: string | null): string {
  if (!status) return "bg-zinc-700 text-zinc-400";
  if (status === "active") return "bg-emerald-500/20 text-emerald-300";
  if (status === "suspended") return "bg-amber-500/20 text-amber-200";
  if (status === "banned") return "bg-red-500/20 text-red-300";
  if (status === "pending") return "bg-amber-500/20 text-amber-200";
  return "bg-zinc-700 text-zinc-300";
}

function riderRecordBadgeClass(status: string | null): string {
  if (!status) return "bg-zinc-700 text-zinc-400";
  if (status === "active" || status === "approved") return "bg-emerald-500/20 text-emerald-300";
  if (status === "pending") return "bg-amber-500/20 text-amber-200";
  if (status === "rejected") return "bg-rose-500/20 text-rose-200";
  return "bg-zinc-700 text-zinc-300";
}

function pickRiderBlob(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  const nested = root.rider && typeof root.rider === "object" ? asRecord(root.rider) : null;
  return nested ?? root;
}

function pickUserBlob(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  const rider = pickRiderBlob(raw);
  const fromRider = rider.user && typeof rider.user === "object" ? asRecord(rider.user) : null;
  const top = root.user && typeof root.user === "object" ? asRecord(root.user) : null;
  return { ...fromRider, ...top };
}

function pickRejectionReason(raw: Record<string, unknown>): string {
  return getStr(raw, "rejectionReason", "rejection_reason").trim();
}

function pickOnboardingMissing(raw: Record<string, unknown>): string[] {
  const v = raw.onboardingMissing ?? raw.onboarding_missing;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

const KYC_FIELDS: { label: string; camel: string; snake: string }[] = [
  { label: "License", camel: "licenseUrl", snake: "license_url" },
  { label: "Vehicle registration", camel: "vehicleRegistrationUrl", snake: "vehicle_registration_url" },
  { label: "Insurance", camel: "insuranceUrl", snake: "insurance_url" },
  { label: "Proof of address", camel: "proofOfAddressUrl", snake: "proof_of_address_url" },
];

export default function AdminRiderDetailPage() {
  const params = useParams();
  const riderId = String(params.riderId ?? "").trim();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const riderQ = useQuery({
    queryKey: ["admin-rider", riderId],
    queryFn: () => fetchAdminRiderById(riderId),
    enabled: Boolean(riderId),
  });

  const invalidateRider = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-rider", riderId] });
  const invalidateDirectory = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-directory", "riders"] });

  const approveMut = useMutation({
    mutationFn: () => adminRiderApprove(riderId),
    onSuccess: () => {
      toast.success("Rider approved.");
      invalidateRider();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      adminRiderReject(riderId, rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
    onSuccess: () => {
      toast.success("Rider rejected (pending).");
      setRejectOpen(false);
      setRejectReason("");
      invalidateRider();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const suspendMut = useMutation({
    mutationFn: () => adminRiderSuspend(riderId),
    onSuccess: () => {
      toast.success("Linked user suspended.");
      invalidateRider();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const banMut = useMutation({
    mutationFn: () => adminRiderBan(riderId),
    onSuccess: () => {
      toast.success("Linked user banned.");
      invalidateRider();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const reinstateMut = useMutation({
    mutationFn: () => adminRiderReinstate(riderId),
    onSuccess: () => {
      toast.success("Linked user reinstated (active).");
      invalidateRider();
      invalidateDirectory();
    },
    onError: (e) => toast.error(formatAdminError(e)),
  });

  const modBusy = suspendMut.isPending || banMut.isPending || reinstateMut.isPending;
  const reviewBusy = approveMut.isPending || rejectMut.isPending;

  if (!riderId) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-sm text-zinc-400">
        Missing rider id.
      </div>
    );
  }

  if (riderQ.isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-zinc-900" />;
  }

  if (riderQ.isError) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
        {formatAdminError(riderQ.error)}
        <p className="mt-3 text-xs text-zinc-500">
          Expected <code className="text-zinc-400">GET /api/v1/admin/riders/:riderId</code>.
        </p>
      </div>
    );
  }

  const raw = asRecord(riderQ.data);
  const mergedForStatus = { ...raw, ...pickRiderBlob(riderQ.data) };
  const rider = pickRiderBlob(riderQ.data);
  const user = pickUserBlob(riderQ.data);

  const riderStatus =
    getStr(rider, "status", "status").toLowerCase().trim() ||
    getStr(raw, "riderStatus", "rider_status").toLowerCase().trim() ||
    null;
  const fullName =
    getStr(rider, "fullName", "full_name") ||
    [getStr(user, "firstName", "first_name"), getStr(user, "lastName", "last_name")].filter(Boolean).join(" ").trim();
  const title = fullName || getStr(user, "email", "email") || "Rider";
  const email = getStr(user, "email", "email") || getStr(rider, "email", "email");
  const phone = getStr(rider, "phone", "phone") || getStr(user, "phone", "phone");
  const vehicleType = getStr(rider, "vehicleType", "vehicle_type");
  const plate = getStr(rider, "plateNumber", "plate_number");
  const dispatchStatus = getStr(rider, "dispatchStatus", "dispatch_status");
  const onboardingComplete = getBool(rider, "onboardingComplete", "onboarding_complete");
  const onboardingMissing = pickOnboardingMissing(rider);
  const rejectionReason = pickRejectionReason(rider) || pickRejectionReason(raw);
  const revalidationPending =
    getBool(rider, "revalidationPending", "revalidation_pending") ||
    getBool(rider, "pendingProfileReview", "pending_profile_review");

  const linkedUserStatus = pickLinkedUserStatus(mergedForStatus) ?? pickLinkedUserStatus(raw);
  const moderationStatus = linkedUserStatus;

  const canSuspendUser = moderationStatus !== "suspended";
  const canBanUser = moderationStatus !== "banned";
  const canReinstateUser = moderationStatus === "suspended" || moderationStatus === "banned";

  const riderReviewDecided =
    (riderStatus === "active" || riderStatus === "approved") && !revalidationPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rider moderation</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{riderId}</p>
        </div>
        <Link
          href="/admin/vendor"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          ← Directory
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-zinc-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {riderStatus ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${riderRecordBadgeClass(riderStatus)}`}
              >
                Rider: {riderStatus}
              </span>
            ) : null}
            {revalidationPending ? (
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-200">
                Re-validation pending
              </span>
            ) : null}
            {moderationStatus ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(moderationStatus)}`}
              >
                User: {moderationStatus}
              </span>
            ) : null}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                onboardingComplete ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-700 text-zinc-400"
              }`}
            >
              Onboarding {onboardingComplete ? "complete" : "incomplete"}
            </span>
          </div>
        </div>
        {(email || phone) && (
          <p className="relative mt-4 text-sm text-zinc-400">
            {email ? <span className="text-zinc-300">{email}</span> : null}
            {email && phone ? <span className="mx-2 text-zinc-600">·</span> : null}
            {phone ? <span>{phone}</span> : null}
          </p>
        )}
        {(vehicleType || plate || dispatchStatus) && (
          <p className="relative mt-2 text-sm text-zinc-500">
            {[vehicleType, plate, dispatchStatus].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">KYC documents</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Approve requires all four URLs. Missing uploads return{" "}
          <code className="text-zinc-400">RIDER_KYC_INCOMPLETE</code> from the API.
        </p>
        <ul className="mt-4 space-y-2">
          {KYC_FIELDS.map(({ label, camel, snake }) => {
            const url = getStr(rider, camel, snake).trim();
            return (
              <li key={camel} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-2 last:border-0">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Open document
                  </a>
                ) : (
                  <span className="text-sm text-zinc-600">Missing</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {onboardingMissing.length > 0 ? (
        <section className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6">
          <h3 className="text-sm font-semibold text-amber-100">Onboarding missing</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
            {onboardingMissing.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {rejectionReason ? (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-300/80">Rejection reason</p>
          <p className="mt-1 text-sm text-rose-100/90 whitespace-pre-wrap">{rejectionReason}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Application</h3>
          {riderReviewDecided ? (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              Approved
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {riderReviewDecided
            ? "This rider is already approved. Approval actions are hidden."
            : revalidationPending
              ? "Approved rider changed vital identity or document fields — profile is paused until you approve or reject."
              : "Review KYC and onboarding before approving or rejecting."}
        </p>
        {!riderReviewDecided ? (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={reviewBusy}
                onClick={() => {
                  if (!window.confirm("Approve this rider? All four KYC documents must be present.")) return;
                  approveMut.mutate();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Approve rider
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
                <label className="block text-sm font-medium text-zinc-400" htmlFor="rider-reject-reason">
                  Reason (optional)
                </label>
                <textarea
                  id="rider-reject-reason"
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
        <h3 className="text-sm font-semibold text-white">Linked user moderation</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Suspend, ban, or reinstate the rider&apos;s user account (same pattern as vendor owner moderation).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">User status</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(moderationStatus)}`}
          >
            {moderationStatus ?? "Unknown"}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={modBusy || !canSuspendUser}
            onClick={() => {
              if (!window.confirm("Suspend this rider's user account?")) return;
              suspendMut.mutate();
            }}
            className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-950/60 disabled:opacity-50"
          >
            Suspend user
          </button>
          <button
            type="button"
            disabled={modBusy || !canBanUser}
            onClick={() => {
              if (!window.confirm("Ban this rider's user account? Confirm with your policy.")) return;
              banMut.mutate();
            }}
            className="rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-950/50 disabled:opacity-50"
          >
            Ban user
          </button>
          <button
            type="button"
            disabled={modBusy || !canReinstateUser}
            onClick={() => {
              reinstateMut.mutate();
            }}
            className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-50"
          >
            Reinstate (active)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Identifiers</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rider id</dt>
            <dd className="mt-0.5 font-mono text-sm text-zinc-300 break-all">{getStr(rider, "id", "id") || riderId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">User id</dt>
            <dd className="mt-0.5 font-mono text-sm text-zinc-300 break-all">
              {getStr(user, "id", "id") || getStr(rider, "userId", "user_id") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <details className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-400">Raw JSON</summary>
        <pre className="mt-3 max-h-[min(480px,70vh)] overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">
          {JSON.stringify(riderQ.data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
