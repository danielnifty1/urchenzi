"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import { isValidVendorId } from "@/lib/admin/uuid";
import {
  fetchAdminRiders,
  fetchAdminUsers,
  fetchAdminVendors,
  type AdminListRow,
} from "@/services/adminDirectoryApi";

type Tab = "vendors" | "riders" | "users";

function DirectoryTable({
  rows,
  notFound,
  emptyHint,
  linkForRow,
}: {
  rows: AdminListRow[];
  notFound: boolean;
  emptyHint: string;
  linkForRow?: (row: AdminListRow) => string | null;
}) {
  if (notFound) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
        This list endpoint is not available yet (404). Add it under{" "}
        <code className="text-amber-200/80">/api/v1/admin/...</code> — see{" "}
        <code className="text-zinc-500">services/adminDirectoryApi.ts</code>.
      </p>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyHint}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Id</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => {
            const href = linkForRow?.(row) ?? null;
            return (
              <tr key={row.id} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-medium text-zinc-200">{row.name}</td>
                <td className="px-4 py-3 text-zinc-400">{row.email ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{row.role ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{row.status ?? "—"}</td>
                <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-600" title={row.id}>
                  {row.id}
                </td>
                <td className="px-4 py-3 text-right">
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Open
                    </Link>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminVendorDirectoryPage() {
  const router = useRouter();
  const { user } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("vendors");
  const [vendorId, setVendorId] = useState("");
  const [manualError, setManualError] = useState("");

  const vendorsQ = useQuery({
    queryKey: ["admin-directory", "vendors"],
    queryFn: () => fetchAdminVendors(),
    enabled: !!user && user.role === "admin" && tab === "vendors",
  });

  const ridersQ = useQuery({
    queryKey: ["admin-directory", "riders"],
    queryFn: () => fetchAdminRiders(),
    enabled: !!user && user.role === "admin" && tab === "riders",
  });

  const usersQ = useQuery({
    queryKey: ["admin-directory", "users"],
    queryFn: () => fetchAdminUsers(),
    enabled: !!user && user.role === "admin" && tab === "users",
  });

  const activeQuery = useMemo(() => {
    if (tab === "vendors") return vendorsQ;
    if (tab === "riders") return ridersQ;
    return usersQ;
  }, [tab, vendorsQ, ridersQ, usersQ]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const goManual = (e: FormEvent) => {
    e.preventDefault();
    const v = vendorId.trim();
    if (!isValidVendorId(v)) {
      setManualError("Enter a valid vendor UUID.");
      return;
    }
    setManualError("");
    router.push(`/admin/${v}`);
  };

  const tabs: { id: Tab; label: string; hint: string }[] = [
    // { id: "vendors", label: "Vendors", hint: "GET /admin/vendorsd" },
    { id: "vendors", label: "Vendors", hint: "" },

    // { id: "riders", label: "Riders", hint: "GET /admin/riders" },
    { id: "riders", label: "Riders", hint: "" },

    // { id: "users", label: "Users", hint: "GET /admin/users" },
    { id: "users", label: "Users", hint: "" },

  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Directory</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Browse vendors, riders, and users from the API. For vendors, use <strong className="text-zinc-300">Open</strong>{" "}
          to jump into that store&apos;s admin workspace — no copy-paste.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-600">{tabs.find((x) => x.id === tab)?.hint}</p>

      {activeQuery.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-zinc-900" />
      ) : activeQuery.error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
          {formatAdminError(activeQuery.error)}
        </div>
      ) : tab === "vendors" ? (
        <DirectoryTable
          rows={vendorsQ.data?.rows ?? []}
          notFound={vendorsQ.data?.notFound ?? false}
          emptyHint="No vendors returned."
          linkForRow={(row) => `/admin/${row.id}`}
        />
      ) : tab === "riders" ? (
        <DirectoryTable
          rows={ridersQ.data?.rows ?? []}
          notFound={ridersQ.data?.notFound ?? false}
          emptyHint="No riders returned."
        />
      ) : (
        <DirectoryTable
          rows={usersQ.data?.rows ?? []}
          notFound={usersQ.data?.notFound ?? false}
          emptyHint="No users returned."
        />
      )}

      <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-400">
          Open vendor by UUID (manual)
        </summary>
        <form onSubmit={goManual} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Vendor UUID"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-600"
            spellCheck={false}
          />
          {manualError ? <p className="text-sm text-red-400">{manualError}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Go to vendor workspace
          </button>
        </form>
      </details>

      <p className="text-center text-sm text-zinc-600">
        <Link href="/admin" className="text-emerald-500 hover:underline">
          ← Dashboard
        </Link>
      </p>
    </div>
  );
}
