"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { formatAdminError } from "@/lib/admin/formatAdminError";
import {
  assignRoleFormSchema,
  RBAC_STORE_ROLE_SLUGS,
  toAssignBody,
  type AssignRoleFormValues,
} from "@/lib/admin/rbacAssignmentSchema";
import {
  adminRbacAssign,
  adminRbacListStores,
  adminRbacListUserRoles,
  adminRbacRevoke,
  adminRbacSearchUsers,
  fetchAdminMeRbacGate,
} from "@/services/adminRbacApi";
import type { AdminRbacUserRow } from "@/types/adminRbac";

const QK_STORES = (userId: string) => ["admin-rbac-stores", userId] as const;
const QK_USERS = (q: string) => ["admin-rbac-users", q] as const;
const QK_ROLES = (userId: string) => ["admin-rbac-user-roles", userId] as const;

function humanRole(slug: string): string {
  return slug.replace(/_/g, " ");
}

export function AdminRbacRoleAssignments() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const gateQ = useQuery({
    queryKey: ["admin-rbac-gate"],
    queryFn: fetchAdminMeRbacGate,
    enabled: Boolean(user),
    retry: 1,
  });

  const allowed = useMemo(() => {
    if (!user || user.role !== "admin") return false;
    if (gateQ.isPending) return null;
    if (gateQ.isError) return true;
    return Boolean(gateQ.data?.allowed);
  }, [user, gateQ.isPending, gateQ.isError, gateQ.data?.allowed]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const usersQ = useQuery({
    queryKey: QK_USERS(debouncedSearch),
    queryFn: () => adminRbacSearchUsers(debouncedSearch),
    enabled: allowed === true && debouncedSearch.trim().length >= 2,
  });

  const [selectedUser, setSelectedUser] = useState<AdminRbacUserRow | null>(null);
  const [scope, setScope] = useState<"global" | "store">("store");
  const [storeId, setStoreId] = useState<string>("");
  const [roleSlug, setRoleSlug] = useState<string>("store_manager");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const storesQ = useQuery({
    queryKey: QK_STORES(selectedUser?.id ?? ""),
    queryFn: () =>
      adminRbacListStores({
        userId: selectedUser!.id,
        email: selectedUser!.email || undefined,
      }),
    enabled: allowed === true && scope === "store" && Boolean(selectedUser?.id),
  });

  useEffect(() => {
    setStoreId("");
  }, [selectedUser?.id]);

  const rolesQ = useQuery({
    queryKey: QK_ROLES(selectedUser?.id ?? ""),
    queryFn: () => adminRbacListUserRoles(selectedUser!.id),
    enabled: allowed === true && Boolean(selectedUser?.id),
  });

  useEffect(() => {
    if (scope === "global") {
      setRoleSlug("super_admin");
      setStoreId("");
    } else if (roleSlug === "super_admin") {
      setRoleSlug("store_manager");
    }
  }, [scope, roleSlug]);

  const assignMut = useMutation({
    mutationFn: adminRbacAssign,
    onSuccess: async () => {
      toast.success("Role assigned.");
      setFieldErrors({});
      if (selectedUser) {
        await queryClient.invalidateQueries({ queryKey: QK_ROLES(selectedUser.id) });
      }
    },
    onError: (err) => toast.error(formatAdminError(err)),
  });

  const revokeMut = useMutation({
    mutationFn: adminRbacRevoke,
    onSuccess: async (_, vars) => {
      toast.success("Role revoked.");
      await queryClient.invalidateQueries({ queryKey: QK_ROLES(vars.targetUserId) });
    },
    onError: (err) => toast.error(formatAdminError(err)),
  });

  const onAssign = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser) {
        toast.error("Select a user first.");
        return;
      }
      const values: AssignRoleFormValues = {
        targetUserId: selectedUser.id,
        scope,
        storeId: scope === "store" ? storeId || null : null,
        roleSlug: roleSlug as AssignRoleFormValues["roleSlug"],
      };
      const parsed = assignRoleFormSchema.safeParse(values);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join(".") || "_form";
          if (!next[key]) next[key] = issue.message;
        }
        setFieldErrors(next);
        toast.error("Fix the form and try again.");
        return;
      }
      setFieldErrors({});
      assignMut.mutate(toAssignBody(parsed.data));
    },
    [selectedUser, scope, storeId, roleSlug, assignMut],
  );

  if (allowed === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-pulse py-4">
        <div className="h-10 w-2/3 rounded-lg bg-zinc-900" />
        <div className="h-32 rounded-2xl bg-zinc-900" />
        <div className="h-48 rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center">
        <h1 className="text-lg font-semibold text-white">No access</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Role assignment is limited to platform super admins. Implement{" "}
          <code className="text-zinc-400">GET /admin/me</code> with{" "}
          <code className="text-zinc-400">isSuperAdmin</code> or{" "}
          <code className="text-zinc-400">rbacAssignmentAllowed</code>, or sign in with a legacy admin account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Role assignments</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Assign RBAC roles per store or globally (<span className="font-mono text-zinc-400">super_admin</span> only
          with global scope). The API enforces privilege rules; the UI is a convenience layer.
        </p>
      </div>

      <section className="space-y-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step A — User</h2>
        <div>
          <label htmlFor="rbac-user-search" className="mb-2 block text-sm font-medium text-zinc-300">
            Search by email or name
          </label>
          <input
            id="rbac-user-search"
            type="search"
            autoComplete="off"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Type at least 2 characters…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
          />
          {fieldErrors.targetUserId ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.targetUserId}</p>
          ) : null}
        </div>

        {debouncedSearch.trim().length >= 2 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
            {usersQ.isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-900" />
                ))}
              </div>
            ) : usersQ.data && usersQ.data.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No users match that search.</p>
            ) : (
              <ul className="max-h-56 divide-y divide-zinc-800 overflow-y-auto" role="listbox">
                {usersQ.data?.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setFieldErrors({});
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-zinc-800/80 ${
                        selectedUser?.id === u.id ? "bg-emerald-500/10 text-emerald-200" : "text-zinc-200"
                      }`}
                    >
                      <span className="font-medium">{u.email}</span>
                      {u.name ? <span className="text-xs text-zinc-500">{u.name}</span> : null}
                      <span className="font-mono text-[10px] text-zinc-600">{u.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-600">Uses GET /admin/users?q=…</p>
        )}

        {selectedUser ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100/90">
            Selected: <strong>{selectedUser.email}</strong>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="ml-3 text-xs text-emerald-400 underline hover:text-emerald-300"
            >
              Clear
            </button>
          </div>
        ) : null}
      </section>

      <form
        onSubmit={onAssign}
        className="space-y-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step B — Scope</h2>
        <fieldset className="space-y-3">
          <legend className="sr-only">Assignment scope</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 has-[:checked]:border-emerald-500/40 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500/20">
              <input
                type="radio"
                name="scope"
                checked={scope === "store"}
                onChange={() => setScope("store")}
                className="h-4 w-4 border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-200">Store</span>
                <span className="text-xs text-zinc-500">store_owner, store_manager, staff, moderator</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 has-[:checked]:border-emerald-500/40 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500/20">
              <input
                type="radio"
                name="scope"
                checked={scope === "global"}
                onChange={() => setScope("global")}
                className="h-4 w-4 border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-200">Global</span>
                <span className="text-xs text-zinc-500">super_admin only · storeId must be null on server</span>
              </span>
            </label>
          </div>
        </fieldset>

        {scope === "store" ? (
          <div>
            <label htmlFor="rbac-store" className="mb-2 block text-sm font-medium text-zinc-300">
              Store
            </label>
            {!selectedUser ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-500">
                Select a user in Step A first. Stores are loaded per user (
                <span className="font-mono text-zinc-600">GET /admin/rbac/stores?userId=…</span>).
              </p>
            ) : storesQ.isLoading ? (
              <div className="h-11 animate-pulse rounded-xl bg-zinc-900" />
            ) : (
              <select
                id="rbac-store"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              >
                <option value="">Select a store…</option>
                {storesQ.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.slug ? ` (${s.slug})` : ""}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.storeId ? <p className="mt-1 text-xs text-red-400">{fieldErrors.storeId}</p> : null}
            {selectedUser && storesQ.isError ? (
              <p className="mt-2 text-xs text-red-400">{formatAdminError(storesQ.error)}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Global scope sends <span className="font-mono text-zinc-400">storeId: null</span> for{" "}
            <span className="font-mono text-zinc-400">super_admin</span>.
          </p>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step C — Role</h2>
        <div>
          <label htmlFor="rbac-role" className="mb-2 block text-sm font-medium text-zinc-300">
            Role
          </label>
          <select
            id="rbac-role"
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
            disabled={scope === "global"}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scope === "global" ? (
              <option value="super_admin">super_admin</option>
            ) : (
              RBAC_STORE_ROLE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {humanRole(slug)}
                </option>
              ))
            )}
          </select>
          {scope === "global" ? (
            <p className="mt-1 text-xs text-zinc-500">Only super_admin is valid for global scope.</p>
          ) : null}
          {fieldErrors.roleSlug ? <p className="mt-1 text-xs text-red-400">{fieldErrors.roleSlug}</p> : null}
        </div>

        <button
          type="submit"
          disabled={assignMut.isPending || !selectedUser}
          className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
        >
          {assignMut.isPending ? "Assigning…" : "Assign role"}
        </button>
      </form>

      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Current assignments</h2>
        <p className="mt-1 text-xs text-zinc-500">
          From GET /admin/users/:userId/roles (after selecting a user). Revoke calls POST /admin/rbac/revoke.
        </p>
        {!selectedUser ? (
          <p className="mt-6 text-sm text-zinc-500">Select a user to load assignments.</p>
        ) : rolesQ.isLoading ? (
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        ) : rolesQ.isError ? (
          <p className="mt-6 text-sm text-red-400">{formatAdminError(rolesQ.error)}</p>
        ) : !rolesQ.data?.length ? (
          <p className="mt-6 text-sm text-zinc-500">No role rows returned for this user.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Scope</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rolesQ.data.map((row, idx) => (
                  <tr key={row.id ?? `${row.storeId}-${row.roleSlug}-${idx}`}>
                    <td className="px-3 py-3 text-zinc-300">
                      {row.storeId == null ? (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
                          Global
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-zinc-400" title={row.storeId}>
                          {row.storeName ?? row.storeId.slice(0, 8) + "…"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-zinc-200">{row.roleSlug}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={revokeMut.isPending}
                        onClick={() => {
                          if (!selectedUser) return;
                          if (!window.confirm(`Revoke ${row.roleSlug} for this user?`)) return;
                          revokeMut.mutate({
                            targetUserId: selectedUser.id,
                            storeId: row.storeId,
                            roleSlug: row.roleSlug,
                            assignmentId: row.id,
                          });
                        }}
                        className="text-sm font-medium text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
