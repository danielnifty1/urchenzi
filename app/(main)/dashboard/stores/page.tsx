"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { GoogleAddressField } from "@/components/forms/GoogleAddressField";
import { StoreCard } from "@/components/dashboard/StoreCard";
import { StoreGridSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { useVendorOrderAlerts } from "@/contexts/VendorOrderAlertsContext";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardAccessibleStoresQueryKey, dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { useUserStore } from "@/store/userStore";
import { listVendorOrdersScoped } from "@/services/vendorMultiStoreApi";
import { listPaymentBanks, resolveBankAccount } from "@/services/paymentApi";
import { createStore } from "@/services/vendorStoresApi";
import type { StoreImageInput, VendorApiStoreStatus } from "@/types/vendorStore";

export default function DashboardStoresListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const isStoreManager = user?.role === "store_manager";
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newStatus, setNewStatus] = useState<VendorApiStoreStatus>("active");
  const [newBankName, setNewBankName] = useState("");
  const [newBankAccountName, setNewBankAccountName] = useState("");
  const [newBankAccountNumber, setNewBankAccountNumber] = useState("");
  const [newBankCode, setNewBankCode] = useState("");
  const [imageDescription, setImageDescription] = useState("store logo");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!createOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [createOpen]);

  const q = useQuery({
    queryKey: dashboardAccessibleStoresQueryKey(user?.role),
    queryFn: () => fetchMyAccessibleStores(),
  });
  const banksQ = useQuery({
    queryKey: ["payment-banks"],
    queryFn: ({ signal }) => listPaymentBanks(signal),
  });

  const stores = q.data ?? [];

  const storeOrderQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: dashboardStoreKeys.orders(store.id),
      queryFn: () => listVendorOrdersScoped(store.id, { limit: 20 }),
      enabled: q.isSuccess && stores.length > 0 && !isStoreManager,
      refetchInterval: 12_000,
    })),
  });

  const unattendedByStoreId = useMemo(() => {
    const map = new Map<string, number>();
    stores.forEach((store, i) => {
      const rows = storeOrderQueries[i]?.data;
      if (!rows) return;
      map.set(store.id, rows.filter((o) => o.status === "pending").length);
    });
    return map;
  }, [stores, storeOrderQueries]);

  const { silenceRingingForNow, muted: storeListSoundMuted, totalUnattendedOrders } =
    useVendorOrderAlerts();

  const createMut = useMutation({
    mutationFn: async () => {
      let image: StoreImageInput | undefined;
      if (imageFile) {
        image = await imagePayloadFromFile(imageFile, imageDescription.trim() || "store logo");
      }
      return createStore({
        name: newName.trim(),
        address: newAddress.trim(),
        bankName: newBankName.trim(),
        bankAccountName: newBankAccountName.trim(),
        bankAccountNumber: newBankAccountNumber.replace(/\s/g, "").trim(),
        bankCode: newBankCode.trim() || undefined,
        status: newStatus,
        slug: newSlug.trim() || undefined,
        image,
      });
    },
    onSuccess: async (store) => {
      toast.success("Store created");
      setCreateOpen(false);
      setNewName("");
      setNewAddress("");
      setNewSlug("");
      setNewStatus("active");
      setNewBankName("");
      setNewBankAccountName("");
      setNewBankAccountNumber("");
      setNewBankCode("");
      setImageDescription("store logo");
      setImageFile(null);
      await queryClient.invalidateQueries({ queryKey: ["dashboard-accessible-stores"] });
      router.push(`/dashboard/stores/${store.id}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const resolveBankMut = useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      resolveBankAccount(accountNumber, bankCode),
    onSuccess: (data) => {
      if (data.accountName) {
        setNewBankAccountName(data.accountName);
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  useEffect(() => {
    const accountNumber = newBankAccountNumber.replace(/\D/g, "");
    if (!newBankCode || accountNumber.length < 10) {
      setNewBankAccountName("");
      return;
    }
    const timer = setTimeout(() => {
      setNewBankAccountName("");
      resolveBankMut.mutate({ accountNumber, bankCode: newBankCode });
    }, 400);
    return () => clearTimeout(timer);
  }, [newBankAccountNumber, newBankCode]);

  return (
    <div className="min-h-screen bg-[#0f1419] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              ← Global dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Your stores</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {isStoreManager
                ? "Stores you can access with your manager role."
                : "Each store has its own catalog, orders, and settings."}
            </p>
            {!isStoreManager && totalUnattendedOrders > 0 ? (
              <div
                role="status"
                className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-950/35 px-4 py-3 text-sm text-rose-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>
                  <span className="font-semibold">{totalUnattendedOrders}</span> unattended order
                  {totalUnattendedOrders === 1 ? "" : "s"} across your stores (pending). Ringing alerts are on
                  {storeListSoundMuted ? " (muted for now)" : ""}.
                </p>
                <button
                  type="button"
                  onClick={silenceRingingForNow}
                  className="shrink-0 rounded-lg border border-rose-400/50 bg-rose-900/50 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:bg-rose-900/70"
                >
                  Stop ringing for now
                </button>
              </div>
            ) : null}
          </div>
          {!isStoreManager ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
              >
                Add new store
              </button>
              <Link
                href="/onboarding/vendor"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-600 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/50"
              >
                Vendor onboarding
              </Link>
            </div>
          ) : null}
        </header>

        {createOpen ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-[1px] p-4">
            <div className="mx-auto mt-4 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl md:mt-10">
              <h2 className="text-lg font-semibold text-white">Create store</h2>
              {/* <p className="mt-1 text-sm text-zinc-500">
                POST /stores — name, address, status, slug, optional image payload.
              </p> */}
              <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-name">
                    Name
                  </label>
                  <input
                    id="ns-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    placeholder="Store name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-address">
                    Address
                  </label>
                  <GoogleAddressField
                    id="ns-address"
                    variant="dark"
                    value={newAddress}
                    onChange={setNewAddress}
                    placeholder="Search for a street address"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-slug">
                    Slug (optional)
                  </label>
                  <input
                    id="ns-slug"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    placeholder="lekki-branch"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-status">
                    Status
                  </label>
                  <select
                    id="ns-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as VendorApiStoreStatus)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-bank-name">
                    Bank name
                  </label>
                  <select
                    id="ns-bank-name"
                    value={newBankName}
                    onChange={(e) => {
                      const selected = banksQ.data?.find((b) => b.name === e.target.value);
                      setNewBankName(e.target.value);
                      setNewBankCode(selected?.code ?? "");
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="">
                      {banksQ.isLoading ? "Loading banks..." : "Select bank"}
                    </option>
                    {(banksQ.data ?? []).map((bank) => (
                      <option key={`${bank.code}-${bank.name}-${bank.id}`} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-medium text-zinc-400" htmlFor="ns-bank-account-name">
                    <span>Account name</span>
                    {resolveBankMut.isPending ? (
                      <span
                        className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"
                        aria-label="Resolving account name"
                      />
                    ) : null}
                  </label>
                  <input
                    id="ns-bank-account-name"
                    value={newBankAccountName}
                    readOnly
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    placeholder={resolveBankMut.isPending ? "Resolving account name..." : "Account Name"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-bank-account-number">
                    Account number
                  </label>
                  <input
                    id="ns-bank-account-number"
                    value={newBankAccountNumber}
                    onChange={(e) => setNewBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-image">
                    Store image (optional)
                  </label>
                  <input
                    id="ns-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-200"
                  />
                </div>
                {imageFile ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="ns-image-desc">
                      Image description
                    </label>
                    <input
                      id="ns-image-desc"
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      placeholder="store logo"
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    createMut.isPending ||
                    !newName.trim() ||
                    !newAddress.trim() ||
                    !newBankName.trim() ||
                    !newBankAccountName.trim() ||
                    !newBankAccountNumber.trim() ||
                    !newBankCode.trim()
                  }
                  onClick={() => createMut.mutate()}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {createMut.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {q.isLoading ? (
          <StoreGridSkeleton />
        ) : q.error ? (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
            {formatAdminError(q.error)}
          </div>
        ) : !q.data?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <p className="text-lg font-medium text-zinc-200">No stores yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Complete vendor onboarding to create your first storefront.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Create store
              </button>
              <Link
                href="/onboarding/vendor"
                className="rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-200"
              >
                Vendor onboarding
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                manageHref={`/dashboard/stores/${store.id}`}
                unattendedOrders={unattendedByStoreId.get(store.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
