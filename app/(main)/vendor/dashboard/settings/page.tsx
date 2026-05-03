"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { vendorDashboardKeys } from "@/lib/vendorDashboard/queryKeys";
import { getStore, updateStore } from "@/services/vendorStoresApi";
import { listPaymentBanks, resolveBankAccount } from "@/services/paymentApi";
import { getVendorSettings, patchVendorSettings } from "@/services/vendorDashboardApi";
import type { VendorStoreSettings } from "@/types/vendorDashboard";
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

export default function VendorSettingsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const storeId = (searchParams.get("storeId") ?? "").trim() || null;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...vendorDashboardKeys.settings(), storeId ?? "none"],
    queryFn: () => getVendorSettings(storeId),
  });
  const storeQ = useQuery({
    queryKey: [...vendorDashboardKeys.settings(), "bank", storeId ?? "none"],
    queryFn: async () => {
      if (!storeId) return null;
      return getStore(storeId);
    },
    enabled: Boolean(storeId),
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

  const save = useMutation({
    mutationFn: (patch: Partial<VendorStoreSettings>) => patchVendorSettings(patch, storeId),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const saveBank = useMutation({
    mutationFn: async () => {
      if (!storeId) return;
      await updateStore(storeId, {
        bankName: bankDraft.bankName.trim(),
        bankAccountName: bankDraft.bankAccountName.trim(),
        bankAccountNumber: bankDraft.bankAccountNumber.replace(/\s/g, "").trim(),
        bankCode: bankDraft.bankCode.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Bank details updated");
      void queryClient.invalidateQueries({ queryKey: [...vendorDashboardKeys.settings(), "bank", storeId ?? "none"] });
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
        <p className="text-sm text-muted">
          How your business appears to customers and baseline delivery rules.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="w-full space-y-6 rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(buildSettingsPatch(draft));
        }}
      >
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
          <p className="mt-1 text-xs text-muted">Used for /store/&lt;slug&gt; when wired to the catalog.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={draft.category}
            onChange={(e) =>
              setDraft((d) =>
                d ? { ...d, category: e.target.value as VendorCategory } : d,
              )
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
                setDraft((d) =>
                  d ? { ...d, minOrder: parseFloat(e.target.value) || 0 } : d,
                )
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="deliveryFee"
            >
              Delivery fee (USD)
            </label>
            <input
              id="deliveryFee"
              type="number"
              min={0}
              step={0.01}
              value={draft.deliveryFee}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, deliveryFee: parseFloat(e.target.value) || 0 } : d,
                )
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="prepMin"
            >
              Prep time min (min)
            </label>
            <input
              id="prepMin"
              type="number"
              min={1}
              value={draft.prepTimeMin}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, prepTimeMin: parseInt(e.target.value, 10) || 1 } : d,
                )
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="prepMax"
            >
              Prep time max (min)
            </label>
            <input
              id="prepMax"
              type="number"
              min={1}
              value={draft.prepTimeMax}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, prepTimeMax: parseInt(e.target.value, 10) || 1 } : d,
                )
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
            <p className="text-xs text-muted">
              When closed, you can still edit — customers see you as unavailable.
            </p>
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
        <h4 className="text-sm font-semibold text-foreground">Payout bank details</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bankName">
              Bank name
            </label>
            <select
              id="bankName"
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
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
              placeholder={resolveBankMut.isPending ? "Resolving account name..." : "Account Name"}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bankAccountNumber">
              Account number
            </label>
            <input
              id="bankAccountNumber"
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
