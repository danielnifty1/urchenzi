"use client";

import { StoreManagerInviteSection } from "@/components/dashboard/StoreManagerInviteSection";
import { useStoreDashboard } from "@/contexts/StoreDashboardContext";

export default function StoreTeamPage() {
  const { storeId } = useStoreDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Team &amp; managers</h2>
        <p className="mt-1 text-sm text-muted">
          Assign people to help operate this store. Managers only see this location — not your other stores.
        </p>
      </div>

      <StoreManagerInviteSection storeId={storeId} />

      <div className="max-w-2xl rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-sm text-muted">
        <p className="font-medium text-foreground">How it works</p>
        <p className="mt-2">
          Share the invite link (or token) with your teammate. They open it, create an account or sign in with
          the invited email, and accept. Invites expire in 48 hours — create a new invite if it lapses.
        </p>
      </div>
    </div>
  );
}
