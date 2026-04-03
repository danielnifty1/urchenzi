"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useUserStore } from "@/store/userStore";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function VendorOnboardingPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const updateUserRole = useUserStore((state) => state.updateUserRole);

  const [currentStep, setCurrentStep] = useState<Step>(1);
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

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const handleNext = () => {
    if (currentStep === 1 && (!formData.storeName.trim() || !formData.category)) {
      toast.error("Please fill in all fields");
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      updateUserRole("vendor", "active");
      toast.success("Welcome! Your vendor account is active.");
      router.push("/vendor/dashboard");
    } catch (err) {
      toast.error("Failed to complete setup");
    }
  };

  const steps = [
    {
      title: "Store Information",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Tell Us About Your Store
            </h2>
            <p className="text-muted">This helps customers find your products</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Store Name
              </label>
              <input
                type="text"
                placeholder="e.g., Fresh Market, Quick Bites"
                value={formData.storeName}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
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
              <label className="block text-sm font-semibold text-foreground mb-2">
                Business Type
              </label>
              <div className="space-y-2">
                {["new", "existing"].map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition ${
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
                    <span className="font-semibold text-foreground capitalize">
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
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Operating Hours & Service Areas
            </h2>
            <p className="text-muted">When and where can you deliver?</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Opening Time
              </label>
              <input
                type="time"
                value={formData.hours.open}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: { ...formData.hours, open: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Closing Time
              </label>
              <input
                type="time"
                value={formData.hours.close}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: { ...formData.hours, close: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Service Areas (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Downtown", "North", "South", "East"].map((area) => (
                  <label
                    key={area}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-brand"
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
                            serviceArea: formData.serviceArea.filter(
                              (a) => a !== area
                            ),
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
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Banking Information
            </h2>
            <p className="text-muted">Where should we send your earnings?</p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 mb-4">
            <p className="text-sm text-foreground font-semibold">
              Your banking information is encrypted and secure
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g., Standard Bank"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="Your name on the account"
                value={formData.accountHolder}
                onChange={(e) =>
                  setFormData({ ...formData, accountHolder: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Account Number
              </label>
              <input
                type="text"
                placeholder="Your bank account number"
                value={formData.bankAccount}
                onChange={(e) =>
                  setFormData({ ...formData, bankAccount: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
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
          <div className="text-6xl">📸</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Upload Your Menu</h2>
            <p className="text-muted">
              Add products with photos and descriptions
            </p>
          </div>
          <div className="rounded-lg border-2 border-dashed border-brand p-8">
            <p className="font-semibold text-foreground mb-2">
              Drag and drop or click to upload
            </p>
            <p className="text-sm text-muted">
              You can do this after setup is complete
            </p>
          </div>
          <div className="text-sm text-muted space-y-1">
            <p>✓ Include clear product photos</p>
            <p>✓ Add descriptions and prices</p>
            <p>✓ Mark items available/unavailable</p>
          </div>
        </div>
      ),
    },
    {
      title: "Documents",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Business Documents
            </h2>
            <p className="text-muted">Help us verify your business</p>
          </div>
          <div className="space-y-3">
            {[
              "Business Registration",
              "Tax ID",
              "Store Photo",
              "Owner ID",
            ].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <span className="font-semibold text-foreground">{doc}</span>
                <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                  Upload
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">
            Documents are verified within 24 hours
          </p>
        </div>
      ),
    },
    {
      title: "Ready to Sell",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Our Seller Community!
            </h2>
            <p className="text-muted">
              Your store setup is complete. Start selling now!
            </p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Store configured</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Banking verified</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Ready to accept orders</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={6}
      stepName={steps[currentStep - 1].title}
      onBack={currentStep > 1 ? () => setCurrentStep((currentStep - 1) as Step) : undefined}
      onNext={handleNext}
      nextLabel={currentStep === 6 ? "Go to Dashboard" : "Continue"}
    >
      {steps[currentStep - 1].render}
    </OnboardingLayout>
  );
}
