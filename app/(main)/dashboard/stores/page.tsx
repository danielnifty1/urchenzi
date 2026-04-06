"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { StoreCard } from "@/components/dashboard/StoreCard";
import { StoreGridSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { fetchMyAccessibleStores } from "@/services/storeDirectoryApi";
import { createStore } from "@/services/vendorStoresApi";

export default function DashboardStoresListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const q = useQuery({
    queryKey: ["dashboard-accessible-stores"],
    queryFn: () => fetchMyAccessibleStores(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createStore({
        name: newName.trim(),
        address: newAddress.trim(),
      }),
    onSuccess: async (store) => {
      toast.success("Store created");
      setCreateOpen(false);
      setNewName("");
      setNewAddress("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard-accessible-stores"] });
      router.push(`/dashboard/stores/${store.id}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

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
              Each store has its own catalog, orders, and settings.
            </p>
          </div>
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
        </header>

        {createOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white">Create store</h2>
              <p className="mt-1 text-sm text-zinc-500">POST /stores — name and address are required.</p>
              <div className="mt-4 space-y-3">
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
                  <textarea
                    id="ns-address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    placeholder="Street, city, …"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={createMut.isPending || !newName.trim() || !newAddress.trim()}
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
              <StoreCard key={store.id} store={store} manageHref={`/dashboard/stores/${store.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
