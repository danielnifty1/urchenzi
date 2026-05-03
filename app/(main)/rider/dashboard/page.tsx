"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useOrderSnapshotSounds } from "@/hooks/useOrderSnapshotSounds";
import {
  getApiErrorMessage,
  isRiderOnboardingIncompleteError,
  isRiderOnboardingRequiredError,
  shouldRedirectToRiderOnboarding,
} from "@/lib/auth/apiErrors";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import {
  getRiderMe,
  getRiderOrders,
  patchRiderAvailability,
  patchRiderLocation,
  patchRiderMe,
  postRiderOrderAccept,
  postRiderOrderDeliveryFailed,
  postRiderOrderDelivered,
  postRiderOrderReject,
  uploadRiderOnboardingDocument,
  type RiderMe,
  type RiderOrder,
  type RiderOrderStatus,
} from "@/services/riderApi";
import { playNotificationSound, stopRepeatingRing } from "@/lib/sounds/playNotificationSound";
import { listPaymentBanks, resolveBankAccount } from "@/services/paymentApi";
import { useUserStore } from "@/store/userStore";

const ORDER_TABS: { id: "all" | RiderOrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "ready", label: "Ready" },
  { id: "assigned", label: "Assigned" },
  { id: "in_transit", label: "In transit" },
  { id: "delivered", label: "Delivered" },
  { id: "delivery_failed", label: "Delivery failed" },
  { id: "cancelled", label: "Cancelled" },
];

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function dispatchLabel(s: RiderMe["dispatchStatus"]): string {
  switch (s) {
    case "available":
      return "Available";
    case "busy":
      return "Busy";
    case "offline":
    default:
      return "Offline";
  }
}

function riderOrderActions(o: RiderOrder): {
  kind: "accept" | "reject" | "delivered" | "delivery_failed";
  label: string;
}[] {
  if (o.status === "delivered" || o.status === "cancelled" || o.status === "delivery_failed") {
    return [];
  }
  /** POST …/accept moves order to in_transit — then POST …/delivered completes. */
  if (o.status === "in_transit") {
    return [
      { kind: "delivered", label: "Mark delivered" },
      { kind: "delivery_failed", label: "Couldn’t deliver" },
    ];
  }
  if (o.status !== "assigned") return [];
  const accepted = Boolean(o.riderAcceptedAt && String(o.riderAcceptedAt).trim());
  if (accepted) {
    return [
      { kind: "delivered", label: "Mark delivered" },
      { kind: "delivery_failed", label: "Couldn’t deliver" },
    ];
  }
  return [
    { kind: "accept", label: "Accept" },
    { kind: "reject", label: "Reject" },
  ];
}

export default function RiderDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const authResolved = useUserStore((s) => s.authResolved);

  const canFetchRider = Boolean(
    authResolved && user && user.role === "rider" && isProfileComplete(user),
  );

  const riderQ = useQuery({
    queryKey: ["rider-me"],
    queryFn: getRiderMe,
    enabled: canFetchRider,
  });

  /** Orders / dispatch only when fully approved, not paused for profile re-review. */
  const riderCanUseDashboard =
    riderQ.isSuccess &&
    riderQ.data &&
    riderQ.data.revalidationPending !== true &&
    (riderQ.data.status === undefined || riderQ.data.status === "approved") &&
    riderQ.data.onboardingComplete !== false;

  const [draft, setDraft] = useState<RiderMe | null>(null);
  const [orderTab, setOrderTab] = useState<"all" | RiderOrderStatus>("all");
  const [deliveryFailFor, setDeliveryFailFor] = useState<string | null>(null);
  const [deliveryFailNote, setDeliveryFailNote] = useState("");
  const [bankDraft, setBankDraft] = useState({
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankCode: "",
  });

  const ordersQ = useQuery({
    queryKey: ["rider-orders"],
    queryFn: getRiderOrders,
    enabled: riderCanUseDashboard,
    refetchInterval: 15_000,
  });
  const banksQ = useQuery({
    queryKey: ["payment-banks"],
    queryFn: ({ signal }) => listPaymentBanks(signal),
    enabled: canFetchRider,
  });

  useOrderSnapshotSounds(
    ordersQ.data?.map((o) => ({ id: o.id, status: o.status })),
    riderCanUseDashboard && ordersQ.data !== undefined,
    "rider",
  );

  const onRiderWorkerError = (e: unknown) => {
    if (isRiderOnboardingIncompleteError(e) || isRiderOnboardingRequiredError(e)) {
      toast.error(getApiErrorMessage(e));
      void queryClient.invalidateQueries({ queryKey: ["rider-me"] });
      router.replace("/onboarding/rider");
      return;
    }
    playNotificationSound("error");
    toast.error(getApiErrorMessage(e));
  };

  useEffect(() => {
    if (!authResolved) return;
    if (!user) {
      router.replace("/login?returnUrl=/rider/dashboard");
      return;
    }
    if (user.role !== "rider") {
      router.replace("/");
      return;
    }
    if (!isProfileComplete(user)) {
      router.replace(profileCompletionPath("/rider/dashboard", "rider"));
    }
  }, [authResolved, user, router]);

  useEffect(() => {
    if (!canFetchRider || riderQ.isPending) return;
    if (riderQ.isError && shouldRedirectToRiderOnboarding(riderQ.error)) {
      router.replace("/onboarding/rider");
      return;
    }
    if (riderQ.isError) return;
    const r = riderQ.data;
    if (r?.revalidationPending === true) return;
    if (r && r.status === "rejected") {
      router.replace("/onboarding/rider");
      return;
    }
    if (r && r.status === "pending") {
      router.replace("/onboarding/rider");
      return;
    }
    if (r && r.onboardingComplete === false) {
      router.replace("/onboarding/rider");
    }
  }, [canFetchRider, riderQ.isPending, riderQ.isError, riderQ.data, riderQ.error, router]);

  useEffect(() => {
    if (!ordersQ.isError || !ordersQ.error) return;
    if (isRiderOnboardingIncompleteError(ordersQ.error) || isRiderOnboardingRequiredError(ordersQ.error)) {
      toast.error(getApiErrorMessage(ordersQ.error));
      void queryClient.invalidateQueries({ queryKey: ["rider-me"] });
      router.replace("/onboarding/rider");
    }
  }, [ordersQ.isError, ordersQ.error, queryClient, router]);

  useEffect(() => {
    if (riderQ.data) setDraft(riderQ.data);
  }, [riderQ.data]);
  useEffect(() => {
    if (!riderQ.data) return;
    setBankDraft({
      bankName: riderQ.data.bankName ?? "",
      bankAccountName: riderQ.data.bankAccountName ?? "",
      bankAccountNumber: riderQ.data.bankAccountNumber ?? "",
      bankCode: riderQ.data.bankCode ?? "",
    });
  }, [riderQ.data]);
  useEffect(() => {
    if (!bankDraft.bankName || bankDraft.bankCode || !banksQ.data?.length) return;
    const selected = banksQ.data.find((b) => b.name === bankDraft.bankName);
    if (!selected) return;
    setBankDraft((d) => ({ ...d, bankCode: selected.code }));
  }, [banksQ.data, bankDraft.bankName, bankDraft.bankCode]);

  const saveMut = useMutation({
    mutationFn: patchRiderMe,
    onSuccess: (result) => {
      setDraft(result.rider);
      queryClient.setQueryData(["rider-me"], result.rider);
      if (result.message) toast.success(result.message);
      else toast.success("Rider profile updated.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const saveBankMut = useMutation({
    mutationFn: () =>
      patchRiderMe({
        bankName: bankDraft.bankName.trim(),
        bankAccountName: bankDraft.bankAccountName.trim(),
        bankAccountNumber: bankDraft.bankAccountNumber.replace(/\D/g, ""),
        bankCode: bankDraft.bankCode.trim(),
      }),
    onSuccess: (result) => {
      setDraft(result.rider);
      queryClient.setQueryData(["rider-me"], result.rider);
      toast.success("Bank details updated.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const resolveBankMut = useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      resolveBankAccount(accountNumber, bankCode),
    onSuccess: (data) => {
      if (data.accountName) {
        setBankDraft((d) => ({ ...d, bankAccountName: data.accountName }));
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  useEffect(() => {
    const accountNumber = bankDraft.bankAccountNumber.replace(/\D/g, "");
    if (!bankDraft.bankCode || accountNumber.length !== 10) {
      setBankDraft((d) => ({ ...d, bankAccountName: "" }));
      return;
    }
    setBankDraft((d) => ({ ...d, bankAccountName: "" }));
    resolveBankMut.mutate({ accountNumber, bankCode: bankDraft.bankCode });
  }, [bankDraft.bankAccountNumber, bankDraft.bankCode]);

  const licenseFileRef = useRef<HTMLInputElement>(null);

  const licenseUploadMut = useMutation({
    mutationFn: async (file: File) => {
      const image = await imagePayloadFromFile(file, "drivers_license");
      return uploadRiderOnboardingDocument("drivers_license", image);
    },
    onSuccess: (result) => {
      setDraft(result.rider);
      queryClient.setQueryData(["rider-me"], result.rider);
      if (result.message) toast.success(result.message);
      else toast.success("Driver's license uploaded.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const availabilityMut = useMutation({
    mutationFn: patchRiderAvailability,
    onSuccess: (updated) => {
      setDraft((prev) => (prev ? { ...prev, ...updated } : updated));
      queryClient.setQueryData(["rider-me"], updated);
      toast.success(
        updated.isActive
          ? updated.dispatchStatus === "busy"
            ? "You are active (busy on a delivery)."
            : "You are active."
          : "You are inactive.",
      );
    },
    onError: onRiderWorkerError,
  });

  const locationMut = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => patchRiderLocation(lat, lng),
    onSuccess: (updated) => {
      setDraft((prev) => (prev ? { ...prev, ...updated } : updated));
      queryClient.setQueryData(["rider-me"], updated);
      toast.success("Location updated.");
    },
    onError: onRiderWorkerError,
  });

  const orderActionMut = useMutation({
    mutationFn: async ({
      id,
      kind,
      note,
    }: {
      id: string;
      kind: "accept" | "reject" | "delivered" | "delivery_failed";
      note?: string;
    }) => {
      if (kind === "accept") await postRiderOrderAccept(id);
      else if (kind === "reject") await postRiderOrderReject(id);
      else if (kind === "delivery_failed") {
        const trimmed = note?.trim().slice(0, 500) ?? "";
        await postRiderOrderDeliveryFailed(id, {
          code: 1,
          ...(trimmed ? { note: trimmed } : {}),
        });
      } else await postRiderOrderDelivered(id);
    },
    onSuccess: (_, vars) => {
      if (vars.kind === "accept" || vars.kind === "reject") {
        stopRepeatingRing();
      }
      if (vars.kind === "accept") {
        const acceptedAt = new Date().toISOString();
        queryClient.setQueryData<RiderOrder[]>(["rider-orders"], (old) => {
          if (!old) return old;
          return old.map((o) =>
            o.id === vars.id
              ? { ...o, status: "in_transit", riderAcceptedAt: o.riderAcceptedAt ?? acceptedAt }
              : o,
          );
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["rider-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["rider-me"] });
      const msg =
        vars.kind === "accept"
          ? "Order accepted."
          : vars.kind === "reject"
            ? "Order rejected."
            : vars.kind === "delivery_failed"
              ? "Delivery issue reported."
              : "Marked as delivered.";
      toast.success(msg);
    },
    onError: onRiderWorkerError,
  });

  const pendingOrderKey = useMemo(() => {
    const v = orderActionMut.variables;
    return v ? `${v.id}:${v.kind}` : null;
  }, [orderActionMut.variables]);
  const isBankAccountReady = bankDraft.bankAccountNumber.replace(/\D/g, "").length === 10;
  const isBankAccountNameResolved = bankDraft.bankAccountName.trim().length > 0;

  const filteredOrders = useMemo(() => {
    const rows = ordersQ.data ?? [];
    if (orderTab === "all") return rows;
    return rows.filter((o) => o.status === orderTab);
  }, [ordersQ.data, orderTab]);

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationMut.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => toast.error(err.message || "Could not read location."),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  };

  if (!authResolved) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (!user || user.role !== "rider" || !isProfileComplete(user)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
    );
  }

  if (riderQ.isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (riderQ.isError) {
    if (shouldRedirectToRiderOnboarding(riderQ.error)) {
      return (
        <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
      );
    }
    return (
      <div className="mx-auto max-w-4xl py-10">
        <div className="rounded-xl border border-rose-300 bg-rose-100/70 p-4 text-rose-700">
          {getApiErrorMessage(riderQ.error)}
        </div>
      </div>
    );
  }

  const rider = riderQ.data;
  if (rider && rider.revalidationPending !== true && rider.status === "rejected") {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
    );
  }
  if (rider && rider.revalidationPending !== true && rider.status === "pending") {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
    );
  }

  if (rider && rider.onboardingComplete === false) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted">Redirecting…</div>
    );
  }

  const profile = draft ?? riderQ.data;
  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#00A082]/12 via-surface to-surface p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00A082]">Rider</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Delivery dashboard</h1>
        <p className="mt-2 max-w-xl text-muted">
          Stay active for dispatch, share your location for nearest-rider matching, and work orders from
          assignment through delivery.
        </p>
      </div>

      {profile.revalidationPending === true ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-500/40 bg-amber-950/25 p-4 text-sm text-amber-100 shadow-sm"
        >
          <p className="font-semibold text-amber-50">Profile under admin review</p>
          <p className="mt-1 text-amber-100/90">
            A recent change to your identity or documents requires re-approval. Your account is paused for dispatch
            until an administrator reviews your updates. You can still edit your details below if needed.
          </p>
        </div>
      ) : null}

      <>
          <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Availability</h2>
                <p className="mt-1 text-sm text-muted">
                  {profile.isActive
                    ? "You are eligible for dispatch. Status reflects whether you are free or on a run."
                    : "You are inactive and will not be assigned new orders."}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Dispatch:{" "}
                  <span className="font-semibold text-foreground">{dispatchLabel(profile.dispatchStatus)}</span>
                </p>
                {profile.revalidationPending === true ? (
                  <p className="mt-2 text-xs text-amber-200/90">
                    Availability cannot be changed while your profile is under admin review.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.isActive}
                disabled={availabilityMut.isPending || profile.revalidationPending === true}
                onClick={() => availabilityMut.mutate(!profile.isActive)}
                className={`relative inline-flex h-10 w-[5.5rem] shrink-0 items-center rounded-full border-2 border-transparent transition focus:outline-none focus:ring-2 focus:ring-[#00A082]/40 focus:ring-offset-2 disabled:opacity-50 ${
                  profile.isActive ? "bg-[#00A082]" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                    profile.isActive ? "translate-x-8" : "translate-x-1"
                  }`}
                />
                <span className="sr-only">{profile.isActive ? "Active" : "Inactive"}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <button
                type="button"
                disabled={locationMut.isPending}
                onClick={shareLocation}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-[#00A082]/40 disabled:opacity-50"
              >
                {locationMut.isPending ? "Updating location…" : "Share current location"}
              </button>
              {profile.currentLat != null && profile.currentLng != null ? (
                <span className="text-xs text-muted">
                  Last position: {profile.currentLat.toFixed(5)}, {profile.currentLng.toFixed(5)}
                </span>
              ) : (
                <span className="text-xs text-muted">No position on file — share to improve matching.</span>
              )}
            </div>
          </div>

          <form
            className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate({
                fullName: profile.fullName.trim(),
                phone: profile.phone.trim(),
                vehicleType: profile.vehicleType,
                plateNumber: profile.plateNumber.trim(),
              });
            }}
          >
            <h2 className="text-lg font-bold text-foreground">Rider profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Full name</span>
                <input
                  value={profile.fullName}
                  onChange={(e) =>
                    setDraft((d) => {
                      const base = d ?? riderQ.data;
                      return base ? { ...base, fullName: e.target.value } : null;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Phone</span>
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setDraft((d) => {
                      const base = d ?? riderQ.data;
                      return base ? { ...base, phone: e.target.value } : null;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Vehicle type</span>
                <select
                  value={profile.vehicleType}
                  onChange={(e) =>
                    setDraft((d) => {
                      const base = d ?? riderQ.data;
                      return base
                        ? { ...base, vehicleType: e.target.value as "bike" | "car" }
                        : null;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Plate number</span>
                <input
                  value={profile.plateNumber}
                  onChange={(e) =>
                    setDraft((d) => {
                      const base = d ?? riderQ.data;
                      return base ? { ...base, plateNumber: e.target.value } : null;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                />
              </label>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <input
                ref={licenseFileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) licenseUploadMut.mutate(file);
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Driver&apos;s license</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {profile.licenseUrl.trim() ? (
                      <>
                        On file —{" "}
                        <a
                          href={profile.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#00A082] underline-offset-2 hover:underline"
                        >
                          View document
                        </a>
                      </>
                    ) : (
                      "Upload a photo or PDF (same flow as onboarding)."
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={licenseUploadMut.isPending}
                  onClick={() => licenseFileRef.current?.click()}
                  className="shrink-0 rounded-xl bg-[#00A082] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f72] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {licenseUploadMut.isPending ? "Uploading…" : profile.licenseUrl.trim() ? "Replace" : "Upload"}
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72] disabled:opacity-50"
              >
                {saveMut.isPending ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>

          <form
            className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !bankDraft.bankName.trim() ||
                !bankDraft.bankAccountName.trim() ||
                !bankDraft.bankAccountNumber.trim() ||
                !bankDraft.bankCode.trim()
              ) {
                toast.error("Select a bank and enter a valid account number to resolve account name.");
                return;
              }
              saveBankMut.mutate();
            }}
          >
            <h2 className="text-lg font-bold text-foreground">Payout bank details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="riderBankName">
                  Bank name
                </label>
                <select
                  id="riderBankName"
                  value={bankDraft.bankName}
                  onChange={(e) => {
                    const selected = banksQ.data?.find((b) => b.name === e.target.value);
                    setBankDraft((d) => ({
                      ...d,
                      bankName: e.target.value,
                      bankCode: selected?.code ?? "",
                    }));
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                >
                  <option value="">{banksQ.isLoading ? "Loading banks..." : "Select bank"}</option>
                  {(banksQ.data ?? []).map((bank) => (
                    <option key={`${bank.code}-${bank.name}-${bank.id}`} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground"
                  htmlFor="riderBankAccountName"
                >
                  <span>Account name</span>
                  {resolveBankMut.isPending ? (
                    <span
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent"
                      aria-label="Resolving account name"
                    />
                  ) : null}
                </label>
                <input
                  id="riderBankAccountName"
                  value={bankDraft.bankAccountName}
                  readOnly
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                  placeholder={resolveBankMut.isPending ? "Resolving account name..." : "Auto-resolved"}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="riderBankAccountNumber">
                  Account number
                </label>
                <input
                  id="riderBankAccountNumber"
                  value={bankDraft.bankAccountNumber}
                  onChange={(e) =>
                    setBankDraft((d) => ({
                      ...d,
                      bankAccountNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  maxLength={10}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="submit"
                disabled={
                  saveBankMut.isPending ||
                  resolveBankMut.isPending ||
                  !isBankAccountReady ||
                  !isBankAccountNameResolved
                }
                className="rounded-xl bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72] disabled:opacity-50"
              >
                {saveBankMut.isPending ? "Saving..." : "Save bank details"}
              </button>
            </div>
          </form>
      </>

      {riderCanUseDashboard && (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Orders</h2>
            <p className="text-sm text-muted">Assigned runs and history. Filter by order status.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ORDER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOrderTab(t.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  orderTab === t.id
                    ? "bg-[#00A082] text-white shadow-sm"
                    : "border border-border bg-background text-foreground hover:border-[#00A082]/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {ordersQ.isLoading ? (
            <div className="h-40 animate-pulse rounded-xl border border-border bg-background/60" />
          ) : ordersQ.isError ? (
            <div className="rounded-xl border border-rose-300 bg-rose-100/70 p-4 text-sm text-rose-700">
              {getApiErrorMessage(ordersQ.error)}
            </div>
          ) : !filteredOrders.length ? (
            <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-8 text-center text-sm text-muted">
              No orders in this view.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredOrders.map((o) => {
                const actions = riderOrderActions(o);
                return (
                  <li
                    key={o.id}
                    className="rounded-xl border border-border bg-background/60 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted">{o.id.slice(0, 8)}…</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                              o.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : o.status === "delivery_failed"
                                  ? "bg-rose-100 text-rose-900"
                                  : o.status === "cancelled"
                                    ? "bg-zinc-200 text-zinc-800"
                                    : o.status === "in_transit"
                                      ? "bg-sky-100 text-sky-900"
                                      : o.status === "assigned"
                                        ? "bg-amber-100 text-amber-900"
                                        : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {o.status.replace(/_/g, " ")}
                          </span>
                          {o.referenceCode ? (
                            <span className="text-xs text-muted">Ref {o.referenceCode}</span>
                          ) : null}
                        </div>
                        {(o.pickupAddress || o.dropoffAddress) && (
                          <div className="text-sm text-foreground">
                            {o.pickupAddress ? (
                              <p>
                                <span className="font-medium text-muted">Pickup:</span> {o.pickupAddress}
                              </p>
                            ) : null}
                            {o.dropoffAddress ? (
                              <p>
                                <span className="font-medium text-muted">Drop-off:</span> {o.dropoffAddress}
                              </p>
                            ) : null}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          {o.createdAt ? <span>Placed: {formatWhen(o.createdAt)}</span> : null}
                          {o.riderAcceptedAt ? (
                            <span>Accepted: {formatWhen(o.riderAcceptedAt)}</span>
                          ) : null}
                        </div>
                      </div>
                      {actions.length > 0 ? (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {actions.map(({ kind, label }) => {
                            const busy =
                              orderActionMut.isPending && pendingOrderKey === `${o.id}:${kind}`;
                            return (
                              <button
                                key={kind}
                                type="button"
                                disabled={orderActionMut.isPending}
                                onClick={() => {
                                  if (kind === "delivery_failed") {
                                    setDeliveryFailFor(o.id);
                                    setDeliveryFailNote("");
                                    return;
                                  }
                                  orderActionMut.mutate({ id: o.id, kind });
                                }}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                                  kind === "reject" || kind === "delivery_failed"
                                    ? "border border-border bg-background text-foreground hover:border-rose-400/50"
                                    : "bg-[#00A082] text-white hover:bg-[#008f72]"
                                }`}
                              >
                                {busy ? "…" : label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/orders/history"
          className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-[#00A082]/40"
        >
          <p className="text-sm font-semibold text-foreground">Orders</p>
          <p className="mt-1 text-sm text-muted">View delivery history</p>
        </Link>
        <Link
          href="/profile"
          className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-[#00A082]/40"
        >
          <p className="text-sm font-semibold text-foreground">Profile</p>
          <p className="mt-1 text-sm text-muted">Account &amp; payout details</p>
        </Link>
      </div>

      {deliveryFailFor ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !orderActionMut.isPending) {
              setDeliveryFailFor(null);
              setDeliveryFailNote("");
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
            role="dialog"
            aria-labelledby="delivery-fail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delivery-fail-title" className="text-lg font-semibold text-foreground">
              Report delivery issue
            </h3>
            <p className="mt-2 text-sm text-muted">Optional note (max 500 characters).</p>
            <textarea
              value={deliveryFailNote}
              onChange={(e) => setDeliveryFailNote(e.target.value.slice(0, 500))}
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-[#00A082]/20 focus:ring-2"
              placeholder="What happened at the address?"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
                disabled={orderActionMut.isPending}
                onClick={() => {
                  setDeliveryFailFor(null);
                  setDeliveryFailNote("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                disabled={orderActionMut.isPending}
                onClick={() => {
                  orderActionMut.mutate(
                    { id: deliveryFailFor, kind: "delivery_failed", note: deliveryFailNote },
                    {
                      onSuccess: () => {
                        setDeliveryFailFor(null);
                        setDeliveryFailNote("");
                      },
                    },
                  );
                }}
              >
                {orderActionMut.isPending && pendingOrderKey === `${deliveryFailFor}:delivery_failed`
                  ? "…"
                  : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
