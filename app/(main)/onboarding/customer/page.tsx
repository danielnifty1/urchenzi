"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useUserStore } from "@/store/userStore";

type Step = 1 | 2 | 3 | 4 | 5;

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const updateUserRole = useUserStore((state) => state.updateUserRole);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    address: "",
    paymentMethod: "card",
    preferences: [] as string[],
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const handleNext = () => {
    if (currentStep === 1 && !formData.address.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      updateUserRole("customer", "active");
      toast.success("Welcome to UrchenziConnect!");
      router.push("/");
    } catch (err) {
      toast.error("Failed to complete setup");
    }
  };

  const steps = [
    {
      title: "Welcome",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">👋</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Welcome, {user.name.split(" ")[0]}!</h2>
            <p className="text-muted">
              Let's set up your account to start ordering from your favorite vendors.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-foreground">Fast Delivery</p>
                <p className="text-sm text-muted">Get products delivered in minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="font-semibold text-foreground">Wide Selection</p>
                <p className="text-sm text-muted">Browse from thousands of vendors</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold text-foreground">Secure Payments</p>
                <p className="text-sm text-muted">Multiple payment options available</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Delivery Address",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Address</h2>
            <p className="text-muted">Where should we deliver your orders?</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Your Address
              </label>
              <input
                type="text"
                placeholder="Enter your delivery address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm text-accent font-semibold">
                You can save multiple addresses in your profile later
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Payment Method",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Method</h2>
            <p className="text-muted">Choose your preferred payment option</p>
          </div>
          <div className="space-y-3">
            {["card", "cash", "wallet"].map((method) => (
              <label
                key={method}
                className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition ${
                  formData.paymentMethod === method
                    ? "border-brand bg-brand/5"
                    : "border-border hover:border-brand"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={formData.paymentMethod === method}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-semibold text-foreground capitalize">
                    {method === "card" ? "Debit/Credit Card" : method}
                  </p>
                  <p className="text-sm text-muted">
                    {method === "card"
                      ? "Secure online payments"
                      : method === "cash"
                      ? "Pay when order arrives"
                      : "Use wallet balance"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Your Preferences",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your Preferences</h2>
            <p className="text-muted">What are you interested in?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Food", "Groceries", "Pharmacy", "Flowers"].map((pref) => (
              <label
                key={pref}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition ${
                  formData.preferences.includes(pref)
                    ? "border-brand bg-brand/5"
                    : "border-border hover:border-brand"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.includes(pref)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        preferences: [...formData.preferences, pref],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        preferences: formData.preferences.filter((p) => p !== pref),
                      });
                    }
                  }}
                  className="h-4 w-4"
                />
                <span className="font-semibold text-foreground">{pref}</span>
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Go",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">You're All Set!</h2>
            <p className="text-muted">
              Your account is ready to use. Start ordering from your favorite vendors now.
            </p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Address saved</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Payment method configured</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Account activated</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={5}
      stepName={steps[currentStep - 1].title}
      onBack={currentStep > 1 ? () => setCurrentStep((currentStep - 1) as Step) : undefined}
      onNext={handleNext}
      nextLabel={currentStep === 5 ? "Go to Home" : "Continue"}
    >
      {steps[currentStep - 1].render}
    </OnboardingLayout>
  );
}
