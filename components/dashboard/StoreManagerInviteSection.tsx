"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { inviteStoreManager } from "@/services/storeManagerInvitesApi";
import { useUserStore } from "@/store/userStore";

type Props = {
  storeId: string;
};

export function StoreManagerInviteSection({ storeId }: Props) {
  const [managerInviteEmail, setManagerInviteEmail] = useState("");
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const vendorEmail = useUserStore((s) => s.user?.email?.trim().toLowerCase() ?? "");

  const inviteManager = useMutation({
    mutationFn: (email: string) => inviteStoreManager(storeId, email),
    onSuccess: (res) => {
      setLastInviteToken(res.token);
      setManagerInviteEmail("");
      toast.success("Invite created — copy the link and send it to your teammate.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const inviteLink =
    typeof window !== "undefined" && lastInviteToken
      ? `${window.location.origin}/invites/accept?token=${encodeURIComponent(lastInviteToken)}`
      : "";

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Invite a store manager</h3>
      <p className="text-sm text-muted">
        They receive access to this store only (not your other locations). Share the link or token by email
        or chat — we don&apos;t send email automatically.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="manager-invite-email">
            Teammate email
          </label>
          <input
            id="manager-invite-email"
            type="email"
            autoComplete="off"
            value={managerInviteEmail}
            onChange={(e) => setManagerInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none ring-[#00A082]/30 focus:ring-2"
          />
        </div>
        <button
          type="button"
          disabled={
            inviteManager.isPending ||
            !managerInviteEmail.trim() ||
            managerInviteEmail.trim().toLowerCase() === vendorEmail
          }
          onClick={() => {
            if (managerInviteEmail.trim().toLowerCase() === vendorEmail) {
              toast.error("You cannot invite your own vendor account email.");
              return;
            }
            inviteManager.mutate(managerInviteEmail.trim());
          }}
          className="shrink-0 rounded-xl bg-[#00A082] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#008f72] disabled:opacity-50"
        >
          {inviteManager.isPending ? "Creating…" : "Create invite"}
        </button>
      </div>
      {managerInviteEmail.trim().toLowerCase() === vendorEmail && vendorEmail ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">Use a different email than your vendor login.</p>
      ) : null}
      {lastInviteToken ? (
        <div className="space-y-2 rounded-xl border border-border bg-background/80 p-4">
          <p className="text-xs font-medium text-foreground">Share this link (expires in 48 hours)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(inviteLink);
                toast.success("Link copied.");
              }}
              className="rounded-lg bg-[#00A082] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008f72]"
            >
              Copy invite link
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(lastInviteToken);
                toast.success("Token copied.");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50"
            >
              Copy token only
            </button>
          </div>
          <p className="break-all font-mono text-[11px] text-muted">{inviteLink}</p>
        </div>
      ) : null}
    </div>
  );
}
