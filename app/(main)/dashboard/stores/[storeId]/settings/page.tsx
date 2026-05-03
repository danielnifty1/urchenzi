"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { dashboardStoreKeys } from "@/lib/dashboard/queryKeys";
import {
  fetchStoreAssignmentMode,
  patchStoreAssignmentMode,
  type StoreAssignmentMode,
} from "@/services/vendorRiderAssignmentApi";
import { getStore, updateStore } from "@/services/vendorStoresApi";
import { listPaymentBanks, resolveBankAccount } from "@/services/paymentApi";
import { getVendorSettings, patchVendorSettings } from "@/services/vendorDashboardApi";
import type { VendorProductImagePayload, VendorStoreSettings } from "@/types/vendorDashboard";
import { useUserStore } from "@/store/userStore";
import type { VendorCategory } from "@/types";

const CATEGORIES: VendorCategory[] = [
  "food",
  "groceries",
  "pharmacy",
  "shops",
  "restaurants",
  "supermarkets",
  "flowers",
  "alcohol",
  "quick-commerce",
];

function buildSettingsPatch(draft: VendorStoreSettings): Partial<VendorStoreSettings> {
  const slug = draft.storeSlug?.trim();
  return {
    storeName: draft.storeName,
    tagline: draft.tagline,
    category: draft.category,
    minOrder: draft.minOrder,
    deliveryFee: draft.deliveryFee,
    prepTimeMin: draft.prepTimeMin,
    prepTimeMax: draft.prepTimeMax,
    isOpen: draft.isOpen,
    storeSlug: slug ? slug : undefined,
  };
}

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { storeId } = useStoreDashboard();
  const isStoreManager = useUserStore((s) => s.user?.role === "store_manager");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: dashboardStoreKeys.settings(storeId),
    queryFn: () => getVendorSettings(storeId),
  });
  const storeQ = useQuery({
    queryKey: [...dashboardStoreKeys.store(storeId), "bank"],
    queryFn: () => getStore(storeId),
  });

  const assignmentQ = useQuery({
    queryKey: dashboardStoreKeys.assignmentMode(storeId),
    queryFn: () => fetchStoreAssignmentMode(storeId),
  });
  const banksQ = useQuery({
    queryKey: ["payment-banks"],
    queryFn: ({ signal }) => listPaymentBanks(signal),
  });

  const [draft, setDraft] = useState<VendorStoreSettings | null>(null);
  const [bankDraft, setBankDraft] = useState({
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankCode: "",
  });
  const [assignmentMode, setAssignmentMode] = useState<StoreAssignmentMode>("auto");
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<VendorProductImagePayload | undefined>(undefined);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);
  useEffect(() => {
    if (!storeQ.data) return;
    setBankDraft({
      bankName: storeQ.data.bankName ?? "",
      bankAccountName: storeQ.data.bankAccountName ?? "",
      bankAccountNumber: storeQ.data.bankAccountNumber ?? "",
      bankCode: storeQ.data.bankCode ?? "",
    });
  }, [storeQ.data]);
  useEffect(() => {
    if (!bankDraft.bankName || bankDraft.bankCode || !banksQ.data?.length) return;
    const selected = banksQ.data.find((b) => b.name === bankDraft.bankName);
    if (!selected) return;
    setBankDraft((d) => ({ ...d, bankCode: selected.code }));
  }, [banksQ.data, bankDraft.bankName, bankDraft.bankCode]);

  useEffect(() => {
    if (assignmentQ.data) setAssignmentMode(assignmentQ.data);
  }, [assignmentQ.data]);

  const saveAssignment = useMutation({
    mutationFn: (mode: StoreAssignmentMode) => patchStoreAssignmentMode(storeId, mode),
    onSuccess: (_, mode) => {
      setAssignmentMode(mode);
      toast.success(
        mode === "auto"
          ? "Orders will use automatic rider assignment when ready."
          : "You will assign riders manually when orders are ready.",
      );
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.assignmentMode(storeId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const save = useMutation({
    mutationFn: (patch: Partial<VendorStoreSettings> & { image?: VendorProductImagePayload }) =>
      patchVendorSettings(patch, storeId),
    onSuccess: () => {
      setPendingImage(undefined);
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: dashboardStoreKeys.store(storeId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const saveBank = useMutation({
    mutationFn: () =>
      updateStore(storeId, {
        bankName: bankDraft.bankName.trim(),
        bankAccountName: bankDraft.bankAccountName.trim(),
        bankAccountNumber: bankDraft.bankAccountNumber.replace(/\s/g, "").trim(),
        bankCode: bankDraft.bankCode.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Bank details updated");
      void queryClient.invalidateQueries({ queryKey: [...dashboardStoreKeys.store(storeId), "bank"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const resolveBankMut = useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      resolveBankAccount(accountNumber, bankCode),
    onSuccess: (data) => {
      if (data.accountName) {
        setBankDraft((d) => ({ ...d, bankAccountName: data.accountName }));
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
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
  const isBankAccountReady = bankDraft.bankAccountNumber.replace(/\D/g, "").length === 10;
  const isBankAccountNameResolved = bankDraft.bankAccountName.trim().length > 0;

  if (isLoading || !draft) {
    return (
      <div className="max-w-xl animate-pulse space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div className="h-8 w-40 bg-background" />
        <div className="h-10 w-full bg-background" />
        <div className="h-10 w-full bg-background" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-rose-600 dark:text-rose-400">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Store settings</h2>
        <p className="mt-1 text-sm text-muted">How this location appears to customers.</p>
      </div>

      <div className="max-w-2xl space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Rider assignment</h3>
        <p className="text-sm text-muted">
          Auto enqueue dispatch when an order is marked ready (requires Redis on the server). Manual lets
          you pick an eligible rider from the store orders screen.
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="assignmentMode"
              checked={assignmentMode === "auto"}
              disabled={assignmentQ.isLoading || saveAssignment.isPending}
              onChange={() => setAssignmentMode("auto")}
              className="h-4 w-4 border-border text-[#00A082] focus:ring-[#00A082]"
            />
            <span>Automatic</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="assignmentMode"
              checked={assignmentMode === "manual"}
              disabled={assignmentQ.isLoading || saveAssignment.isPending}
              onChange={() => setAssignmentMode("manual")}
              className="h-4 w-4 border-border text-[#00A082] focus:ring-[#00A082]"
            />
            <span>Manual</span>
          </label>
        </div>
        <button
          type="button"
          disabled={
            saveAssignment.isPending ||
            assignmentQ.isLoading ||
            (assignmentQ.isFetched && assignmentMode === (assignmentQ.data ?? "auto"))
          }
          onClick={() => saveAssignment.mutate(assignmentMode)}
          className="rounded-xl bg-[#00A082] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#008f72] disabled:opacity-50"
        >
          {saveAssignment.isPending ? "Saving…" : "Save assignment mode"}
        </button>
      </div>

      {!isStoreManager ? (
        <div className="max-w-2xl flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Store managers</h3>
            <p className="mt-1 text-sm text-muted">
              Invite teammates — they only get access to this store.
            </p>
          </div>
          <Link
            href={`/dashboard/stores/${storeId}/team`}
            className="shrink-0 rounded-xl bg-[#00A082] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#008f72]"
          >
            Open Team page
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="w-full space-y-6 rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ ...buildSettingsPatch(draft), image: pendingImage });
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="storeImage">
            Store image
          </label>
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-background">
              {draft.storeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.storeImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
              )}
            </div>
            <div>
              <input
                id="storeImage"
                type="file"
                accept="image/*"
                className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#00A082] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const image = await imagePayloadFromFile(file, "store image");
                    const url = URL.createObjectURL(file);
                    setPendingImage(image);
                    setDraft((d) => (d ? { ...d, storeImage: url } : d));
                    toast.success("Image ready — save to persist");
                  } catch (err) {
                    toast.error(getApiErrorMessage(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading ? <p className="mt-1 text-xs text-muted">Uploading…</p> : null}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="storeName">
            Store name
          </label>
          <input
            id="storeName"
            value={draft.storeName}
            onChange={(e) => setDraft((d) => (d ? { ...d, storeName: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={draft.description ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            placeholder="Tell customers what makes this store special."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="openingHours">
            Opening hours
          </label>
          <input
            id="openingHours"
            value={draft.openingHours ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, openingHours: e.target.value } : d))}
            placeholder="e.g. Mon–Sat 9:00–21:00"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="tagline">
            Tagline
          </label>
          <input
            id="tagline"
            value={draft.tagline}
            onChange={(e) => setDraft((d) => (d ? { ...d, tagline: e.target.value } : d))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="storeSlug">
            Store slug (URL)
          </label>
          <input
            id="storeSlug"
            value={draft.storeSlug ?? ""}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, storeSlug: e.target.value || undefined } : d))
            }
            placeholder="e.g. my-kitchen"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, category: e.target.value as VendorCategory } : d))
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="minOrder">
              Minimum order (USD)
            </label>
            <input
              id="minOrder"
              type="number"
              min={0}
              step={0.01}
              value={draft.minOrder}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, minOrder: parseFloat(e.target.value) || 0 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="deliveryFee">
              Delivery fee (USD)
            </label>
            <input
              id="deliveryFee"
              type="number"
              min={0}
              step={0.01}
              value={draft.deliveryFee}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, deliveryFee: parseFloat(e.target.value) || 0 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="prepMin">
              Prep time min (min)
            </label>
            <input
              id="prepMin"
              type="number"
              min={1}
              value={draft.prepTimeMin}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, prepTimeMin: parseInt(e.target.value, 10) || 1 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="prepMax">
              Prep time max (min)
            </label>
            <input
              id="prepMax"
              type="number"
              min={1}
              value={draft.prepTimeMax}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, prepTimeMax: parseInt(e.target.value, 10) || 1 } : d))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={draft.isOpen}
            onChange={(e) => setDraft((d) => (d ? { ...d, isOpen: e.target.checked } : d))}
            className="h-4 w-4 rounded border-border text-[#00A082] focus:ring-[#00A082]"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Store is open</span>
            <p className="text-xs text-muted">When closed, customers see you as unavailable.</p>
          </div>
        </label>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-xl bg-[#00A082] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72] disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <form
        className="w-full space-y-6 rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm lg:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          if (isStoreManager) return;
          if (
            !bankDraft.bankName.trim() ||
            !bankDraft.bankAccountName.trim() ||
            !bankDraft.bankAccountNumber.trim() ||
            !bankDraft.bankCode.trim()
          ) {
            toast.error("Select a bank and enter a valid account number to resolve account name.");
            return;
          }
          saveBank.mutate();
        }}
      >
        <h3 className="text-sm font-semibold text-foreground">Payout bank details</h3>
        {isStoreManager ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            Only vendor accounts can update store bank details.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bankName">
              Bank name
            </label>
            <select
              id="bankName"
              value={bankDraft.bankName}
              disabled={isStoreManager}
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
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground" htmlFor="bankAccountName">
              <span>Account name</span>
              {resolveBankMut.isPending ? (
                <span
                  className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent"
                  aria-label="Resolving account name"
                />
              ) : null}
            </label>
            <input
              id="bankAccountName"
              value={bankDraft.bankAccountName}
              readOnly
              disabled={isStoreManager}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
              placeholder={resolveBankMut.isPending ? "Resolving account name..." : "Auto-resolved"}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bankAccountNumber">
              Account number
            </label>
            <input
              id="bankAccountNumber"
              value={bankDraft.bankAccountNumber}
              disabled={isStoreManager}
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
              isStoreManager ||
              saveBank.isPending ||
              resolveBankMut.isPending ||
              !isBankAccountReady ||
              !isBankAccountNameResolved
            }
            className="rounded-xl bg-[#00A082] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00A082]/20 transition hover:bg-[#008f72] disabled:opacity-50"
          >
            {saveBank.isPending ? "Updating…" : "Update bank details"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
