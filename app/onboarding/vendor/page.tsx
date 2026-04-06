"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage, isProfileIncompleteError } from "@/lib/auth/apiErrors";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { me, refreshSession } from "@/services/authApi";
import {
  deleteVendorOnboardingDocument,
  getVendorOnboarding,
  patchVendorOnboarding,
  submitVendorOnboarding,
  uploadVendorOnboardingDocument,
  type VendorOnboardingDocument,
  type VendorOnboardingDocumentType,
} from "@/services/vendorOnboardingApi";
import { useUserStore } from "@/store/userStore";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const onboardingKey = ["vendor-onboarding"] as const;

const DOC_ROWS: { label: string; type: VendorOnboardingDocumentType }[] = [
  { label: "Business Registration", type: "business_registration" },
  { label: "Tax ID", type: "tax_id" },
  { label: "Store Photo", type: "store_photo" },
  { label: "Owner ID", type: "owner_id" },
];

function formToPatch(form: {
  storeName: string;
  category: string;
  businessType: string;
  hours: { open: string; close: string };
  bankAccount: string;
  accountHolder: string;
  bankName: string;
  serviceArea: string[];
}) {
  return {
    storeName: form.storeName.trim() || undefined,
    category: form.category || undefined,
    businessType: (form.businessType as "new" | "existing") || undefined,
    hours: form.hours,
    serviceAreas: form.serviceArea.length ? form.serviceArea : undefined,
    bankName: form.bankName.trim() || undefined,
    accountHolder: form.accountHolder.trim() || undefined,
    bankAccount: form.bankAccount.replace(/\s/g, "").trim() || undefined,
  };
}

export default function VendorOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    category: "",
    businessType: "new",
    hours: { open: "09:00", close: "21:00" },
    bankAccount: "",
    accountHolder: "",
    bankName: "",
    serviceArea: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState<VendorOnboardingDocumentType | null>(null);

  const { data: onboarding, isLoading, error, refetch } = useQuery({
    queryKey: onboardingKey,
    queryFn: async () => {
      const raw = await getVendorOnboarding();
      return raw;
    },
    enabled: !!user && user.role === "vendor" && isProfileComplete(user),
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "vendor") {
      router.replace("/onboarding/select-role");
      return;
    }
    if (!isProfileComplete(user)) {
      router.replace(profileCompletionPath("/onboarding/vendor", "vendor"));
    }
  }, [user, router]);

  useEffect(() => {
    if (!onboarding) return;
    if (onboarding.status === "approved") {
      router.replace("/vendor/dashboard");
    } else if (onboarding.status === "submitted") {
      router.replace("/onboarding/vendor/pending");
    }
  }, [onboarding, router]);

  useEffect(() => {
    if (!onboarding || hydrated) return;
    setFormData({
      storeName: onboarding.storeName ?? "",
      category: onboarding.category ?? "",
      businessType: onboarding.businessType === "existing" ? "existing" : "new",
      hours: onboarding.hours ?? { open: "09:00", close: "21:00" },
      bankAccount: "",
      accountHolder: onboarding.accountHolder ?? "",
      bankName: onboarding.bankName ?? "",
      serviceArea: onboarding.serviceAreas ?? [],
    });
    setHydrated(true);
  }, [onboarding, hydrated]);

  const docForType = useCallback(
    (type: string): VendorOnboardingDocument | undefined =>
      onboarding?.documents?.find((d) => d.type === type),
    [onboarding?.documents],
  );

  const handleComplete = async () => {
    setSaving(true);
    try {
      await patchVendorOnboarding(formToPatch(formData));
      await submitVendorOnboarding();
      const session = await refreshSession().catch(() => me());
      login(session);
      toast.success("Application submitted. We will review it shortly.");
      await queryClient.invalidateQueries({ queryKey: onboardingKey });
      router.push("/onboarding/vendor/pending");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (currentStep === 1 && (!formData.storeName.trim() || !formData.category)) {
      toast.error("Please fill in all fields");
      return;
    }

    if (currentStep === 6) {
      await handleComplete();
      return;
    }

    setSaving(true);
    try {
      const res = await patchVendorOnboarding(formToPatch(formData));
      queryClient.setQueryData(onboardingKey, res);
      setCurrentStep((s) => (s + 1) as Step);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (type: VendorOnboardingDocumentType) => {
    setPendingDocType(type);
    requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = pendingDocType;
    e.target.value = "";
    setPendingDocType(null);
    if (!file || !type) return;
    try {
      await uploadVendorOnboardingDocument(type, file);
      toast.success("Document uploaded");
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const removeDoc = async (id: string) => {
    try {
      await deleteVendorOnboardingDocument(id);
      toast.success("Document removed");
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!user) return null;

  if (user.role !== "vendor" || !isProfileComplete(user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent" />
      </div>
    );
  }

  const awaitingHydration =
    !!onboarding &&
    !hydrated &&
    onboarding.status !== "submitted" &&
    onboarding.status !== "approved";

  if (isLoading || awaitingHydration) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    const profileGate = isProfileIncompleteError(error);
    return (
      <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <p className="font-semibold">Could not load onboarding</p>
        <p className="mt-2 text-sm">{getApiErrorMessage(error)}</p>
        {profileGate ? (
          <p className="mt-4">
            <Link
              href={profileCompletionPath("/onboarding/vendor", "vendor")}
              className="font-semibold text-[#00A082] underline hover:no-underline"
            >
              Complete your profile
            </Link>{" "}
            (first name, last name, phone, address), then return here.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Ensure you are signed in as a vendor and the API is running (
            <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_API_URL</code>
            ).
          </p>
        )}
      </div>
    );
  }

  if (onboarding?.status === "submitted" || onboarding?.status === "approved") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent" />
      </div>
    );
  }

  const rejected = onboarding?.status === "rejected";

  const steps = [
    {
      title: "Store Information",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Tell Us About Your Store</h2>
            <p className="text-muted">This helps customers find your products</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Store Name</label>
              <input
                type="text"
                placeholder="e.g., Fresh Market, Quick Bites"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select a category</option>
                <option value="restaurant">Restaurant</option>
                <option value="grocery">Grocery</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="flowers">Flowers</option>
                <option value="shop">Shop</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Business Type</label>
              <div className="space-y-2">
                {["new", "existing"].map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition ${
                      formData.businessType === type
                        ? "border-brand bg-brand/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="business"
                      value={type}
                      checked={formData.businessType === type}
                      onChange={(e) =>
                        setFormData({ ...formData, businessType: e.target.value })
                      }
                      className="h-4 w-4"
                    />
                    <span className="font-semibold capitalize text-foreground">
                      {type === "new" ? "New Business" : "Existing Business"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Service Hours & Zones",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Operating Hours & Service Areas
            </h2>
            <p className="text-muted">When and where can you deliver?</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Opening Time</label>
              <input
                type="time"
                value={formData.hours.open}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: { ...formData.hours, open: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Closing Time</label>
              <input
                type="time"
                value={formData.hours.close}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: { ...formData.hours, close: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Service Areas (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Downtown", "North", "South", "East"].map((area) => (
                  <label
                    key={area}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:border-brand"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceArea.includes(area)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            serviceArea: [...formData.serviceArea, area],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            serviceArea: formData.serviceArea.filter((a) => a !== area),
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="font-semibold text-foreground">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Banking Details",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Banking Information</h2>
            <p className="text-muted">Where should we send your earnings?</p>
          </div>
          <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              Your banking details are encrypted on the server. We never show your full account
              number after save.
            </p>
            {onboarding?.bankAccountLast4 ? (
              <p className="mt-2 text-sm text-muted">
                Account on file ending in <strong>{onboarding.bankAccountLast4}</strong> — leave
                account number blank to keep it, or enter a new number to replace.
              </p>
            ) : null}
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Bank Name</label>
              <input
                type="text"
                placeholder="e.g., Standard Bank"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="Your name on the account"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Account Number
              </label>
              <input
                type="text"
                placeholder={
                  onboarding?.bankAccount
                    ? "Masked on file — enter new number to replace"
                    : "Your bank account number"
                }
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Upload Products",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl" aria-hidden>
            📸
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Upload Your Menu</h2>
            <p className="text-muted">Add products with photos and descriptions from the dashboard</p>
          </div>
          <div className="rounded-lg border-2 border-dashed border-brand p-8">
            <p className="mb-2 font-semibold text-foreground">After approval</p>
            <p className="text-sm text-muted">
              Use <strong>Vendor dashboard → Menu & products</strong> to add items and images.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Documents",
      render: (
        <div className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={onFileChange}
          />
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Business Documents</h2>
            <p className="text-muted">Help us verify your business (PDF or images, max 10MB)</p>
          </div>
          <div className="space-y-3">
            {DOC_ROWS.map(({ label, type }) => {
              const existing = docForType(type);
              return (
                <div
                  key={type}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <span className="font-semibold text-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    {existing ? (
                      <>
                        <a
                          href={existing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#00A082] hover:underline"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => removeDoc(existing.id)}
                          className="text-sm text-rose-600 hover:underline dark:text-rose-400"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => triggerUpload(type)}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted">Documents are usually verified within 24 hours</p>
        </div>
      ),
    },
    {
      title: "Ready to Sell",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl" aria-hidden>
            🎉
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Review & submit</h2>
            <p className="text-muted">
              Submit your application for review. You can still edit earlier steps via Back until
              you submit.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-6 text-left text-sm">
            <p>
              <span className="font-semibold text-foreground">Store:</span>{" "}
              {formData.storeName || "—"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Category:</span>{" "}
              {formData.category || "—"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Hours:</span>{" "}
              {formData.hours.open}–{formData.hours.close}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {rejected && onboarding?.rejectionReason ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <p className="font-semibold">Previous application was not approved</p>
          <p className="mt-1">{onboarding.rejectionReason}</p>
          <p className="mt-2 text-xs opacity-90">
            Update your details and documents, then continue — saving will move your application
            back to in progress.
          </p>
        </div>
      ) : null}

      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={6}
        stepName={steps[currentStep - 1].title}
        onBack={
          currentStep > 1 ? () => setCurrentStep((currentStep - 1) as Step) : undefined
        }
        onNext={goNext}
        nextDisabled={saving}
        nextLabel={
          currentStep === 6
            ? saving
              ? "Submitting…"
              : "Submit application"
            : saving
              ? "Saving…"
              : "Continue"
        }
      >
        {steps[currentStep - 1].render}
      </OnboardingLayout>
    </div>
  );
}
