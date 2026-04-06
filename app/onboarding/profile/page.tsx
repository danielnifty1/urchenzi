"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { isProfileComplete, parseUserRoleQueryParam } from "@/lib/auth/profileComplete";
import { postCustomerOnboard } from "@/services/customerOnboardingApi";
import { refreshSession } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

function ProfileCompletionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  const nextRaw = searchParams.get("next") ?? "/onboarding/select-role";
  const roleForPayload =
    parseUserRoleQueryParam(searchParams.get("role")) ?? user?.role ?? "customer";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (isProfileComplete(user)) {
      router.replace(nextRaw);
    }
  }, [user, router, nextRaw]);

  useEffect(() => {
    if (!user) return;
    setFirstName((prev) => prev || user.firstName?.trim() || "");
    setLastName((prev) => prev || user.lastName?.trim() || "");
    setPhone((prev) => prev || user.phone?.trim() || "");
    setAddress((prev) => prev || user.address?.trim() || "");
  }, [user]);

  if (!user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please enter your first name, last name, phone number, and address.");
      return;
    }
    setBusy(true);
    try {
      await postCustomerOnboard({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        role: roleForPayload,
      });
      const session = await refreshSession();
      login(session);
      toast.success("Profile saved.");
      router.replace(nextRaw);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 to-accent/5 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Complete your profile</h1>
          <p className="mt-2 text-muted">
            Add your first name, last name, phone, and address before vendor or rider onboarding.
            This matches customer onboarding and is required by the server.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-surface p-8 shadow-lg"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">First name</label>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Last name</label>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Phone</label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Address</label>
            <textarea
              rows={3}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfileCompletionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted">Loading…</div>
      }
    >
      <ProfileCompletionInner />
    </Suspense>
  );
}
