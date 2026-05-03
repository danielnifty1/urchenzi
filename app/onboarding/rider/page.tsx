"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { imagePayloadFromFile } from "@/lib/api/imagePayload";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { me, refreshSession } from "@/services/authApi";
import {
  mapVehicleFormToRiderVehicleType,
  postRidersOnboard,
  uploadRiderOnboardingDocument,
  type RiderDocumentType,
} from "@/services/riderApi";
import { useUserStore } from "@/store/userStore";

type Step = 1 | 2 | 3 | 4 | 5;

const RIDER_DOC_ROWS: { label: string; type: RiderDocumentType }[] = [
  { label: "Driver's License", type: "drivers_license" },
  { label: "Vehicle Registration", type: "vehicle_registration" },
  { label: "Insurance Document", type: "insurance" },
  { label: "Proof of Address", type: "proof_of_address" },
];

function RiderDocumentsStep() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<RiderDocumentType | null>(null);
  const [status, setStatus] = useState<Partial<Record<RiderDocumentType, "uploading" | "done">>>({});
  const [fileLabel, setFileLabel] = useState<Partial<Record<RiderDocumentType, string>>>({});

  const openPicker = (type: RiderDocumentType) => {
    pendingTypeRef.current = type;
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    e.target.value = "";
    if (!file || !type) return;

    setStatus((s) => ({ ...s, [type]: "uploading" }));
    try {
      const image = await imagePayloadFromFile(file, type);
      await uploadRiderOnboardingDocument(type, image);
      setStatus((s) => ({ ...s, [type]: "done" }));
      setFileLabel((s) => ({ ...s, [type]: file.name }));
      toast.success("Document uploaded.");
    } catch (err) {
      setStatus((s) => {
        const next = { ...s };
        delete next[type];
        return next;
      });
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,application/pdf"
        onChange={(e) => void onFileChange(e)}
      />
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Upload Documents</h2>
        <p className="text-muted">Required for verification</p>
      </div>
      <div className="space-y-3">
        {RIDER_DOC_ROWS.map(({ label, type }) => {
          const st = status[type];
          const done = st === "done";
          const uploading = st === "uploading";
          return (
            <div
              key={type}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted">
                  {done && fileLabel[type]
                    ? `Uploaded: ${fileLabel[type]}`
                    : "Required for verification"}
                </p>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => openPicker(type)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading…" : done ? "Replace" : "Upload"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Your documents are verified within 24 hours
        </p>
      </div>
    </div>
  );
}

export default function RiderOnboardingPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
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

  const handleComplete = async () => {
    try {
      const session = await refreshSession().catch(() => me());
      login(session);
      toast.success("Welcome to our rider network!");
      router.push("/rider/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleNext = () => {
    void handleNextAsync();
  };

  async function handleNextAsync() {
    if (currentStep === 2) {
      if (!formData.vehiclePlate.trim() || !formData.licenseNumber.trim()) {
        toast.error("Please fill in all vehicle information");
        return;
      }
      const phone = user?.phone?.trim();
      if (!phone) {
        toast.error("Add a phone number to your profile before continuing.");
        return;
      }
      if (onboardingBusy) return;
      setOnboardingBusy(true);
      try {
        await postRidersOnboard({
          phone,
          vehicleType: mapVehicleFormToRiderVehicleType(formData.vehicleType),
          plateNumber: formData.vehiclePlate.trim(),
        });
        const session = await refreshSession();
        login(session);
        setCurrentStep(3);
        toast.success("Rider profile saved. Upload your documents next.");
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        setOnboardingBusy(false);
      }
      return;
    }

    if (currentStep === 5) {
      await handleComplete();
      return;
    }

    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }

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
      render: <RiderDocumentsStep />,
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
      nextDisabled={onboardingBusy}
      nextLabel={currentStep === 5 ? "Go to Dashboard" : onboardingBusy ? "Saving…" : "Continue"}
    >
      {steps[currentStep - 1].render}
    </OnboardingLayout>
  );
}
