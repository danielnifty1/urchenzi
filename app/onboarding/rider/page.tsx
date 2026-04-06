"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { useUserStore } from "@/store/userStore";

type Step = 1 | 2 | 3 | 4 | 5;

export default function RiderOnboardingPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const updateUserRole = useUserStore((state) => state.updateUserRole);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    vehicleType: "motorcycle",
    vehiclePlate: "",
    licenseNumber: "",
    bankAccount: "",
    accountHolder: "",
    serviceAreas: [] as string[],
    availability: "fulltime",
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    if (!isProfileComplete(user)) {
      router.replace(profileCompletionPath("/onboarding/rider", "rider"));
    }
  }, [user, router]);

  if (!user) return null;

  if (!isProfileComplete(user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#00A082] border-t-transparent" />
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep === 2 && (!formData.vehiclePlate.trim() || !formData.licenseNumber.trim())) {
      toast.error("Please fill in all vehicle information");
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
      updateUserRole("rider", "active");
      toast.success("Welcome to our rider network!");
      router.push("/rider/dashboard");
    } catch (err) {
      toast.error("Failed to complete setup");
    }
  };

  const steps = [
    {
      title: "Welcome",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🏍️</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Start Earning with UrchenziConnect
            </h2>
            <p className="text-muted">
              Join our network of professional delivery riders
            </p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold text-foreground">Competitive Pay</p>
                <p className="text-sm text-muted">Earn per delivery + tips</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-foreground">Flexible Hours</p>
                <p className="text-sm text-muted">Work whenever you want</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold text-foreground">Easy Payouts</p>
                <p className="text-sm text-muted">Get paid daily to your bank</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Vehicle Information",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your Vehicle
            </h2>
            <p className="text-muted">Tell us about your delivery vehicle</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleType: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="scooter">Scooter</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                License Plate
              </label>
              <input
                type="text"
                placeholder="e.g., ABC 123 XY"
                value={formData.vehiclePlate}
                onChange={(e) =>
                  setFormData({ ...formData, vehiclePlate: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Driving License Number
              </label>
              <input
                type="text"
                placeholder="Your license number"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Documents & Verification",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Upload Documents
            </h2>
            <p className="text-muted">Required for verification</p>
          </div>
          <div className="space-y-3">
            {[
              "Driver's License",
              "Vehicle Registration",
              "Insurance Document",
              "Proof of Address",
            ].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{doc}</p>
                  <p className="text-xs text-muted">Required for verification</p>
                </div>
                <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                  Upload
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              Your documents are verified within 24 hours
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Banking & Service Areas",
      render: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Earnings & Service Areas
            </h2>
            <p className="text-muted">Where and how you'll work</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Bank Account (for payouts)
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
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={formData.accountHolder}
                onChange={(e) =>
                  setFormData({ ...formData, accountHolder: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Service Areas (Select your preferred zones)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Downtown", "North", "South", "East"].map((area) => (
                  <label
                    key={area}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-brand"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceAreas.includes(area)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            serviceAreas: [...formData.serviceAreas, area],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            serviceAreas: formData.serviceAreas.filter(
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
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Availability
              </label>
              <div className="space-y-2">
                {["fulltime", "parttime"].map((avail) => (
                  <label
                    key={avail}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition ${
                      formData.availability === avail
                        ? "border-brand bg-brand/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={avail}
                      checked={formData.availability === avail}
                      onChange={(e) =>
                        setFormData({ ...formData, availability: e.target.value })
                      }
                      className="h-4 w-4"
                    />
                    <span className="font-semibold text-foreground capitalize">
                      {avail === "fulltime" ? "Full Time" : "Part Time"}
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
      title: "Ready to Ride",
      render: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Our Rider Team!
            </h2>
            <p className="text-muted">
              You're all set to start earning with UrchenziConnect
            </p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Vehicle verified</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Documents submitted</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-foreground">Ready to accept orders</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Go online to start accepting deliveries and earning money!
          </p>
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
      nextLabel={currentStep === 5 ? "Go to Dashboard" : "Continue"}
    >
      {steps[currentStep - 1].render}
    </OnboardingLayout>
  );
}
