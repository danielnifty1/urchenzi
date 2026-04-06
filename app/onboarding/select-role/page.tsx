"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RoleSelectionCard } from "@/components/onboarding/RoleSelectionCard";
import { getPostAuthRedirectPath } from "@/lib/auth/postAuthRedirect";
import { isProfileComplete, profileCompletionPath } from "@/lib/auth/profileComplete";
import { useUserStore } from "@/store/userStore";
import { UserRole } from "@/types";

const ROLE_OPTIONS: {
  role: UserRole;
  icon: string;
  title: string;
  description: string;
  benefits: string[];
}[] = [
  {
    role: "customer",
    icon: "👤",
    title: "Customer",
    description: "Order from vendors and get deliveries",
    benefits: [
      "Browse thousands of products",
      "Track orders in real-time",
      "Save favorite addresses",
      "Earn loyalty rewards",
    ],
  },
  {
    role: "vendor",
    icon: "🏪",
    title: "Vendor",
    description: "Sell your products and grow your business",
    benefits: [
      "Reach more customers",
      "Manage orders easily",
      "Track analytics",
      "Get verified badge",
    ],
  },
  {
    role: "rider",
    icon: "🏍️",
    title: "Rider",
    description: "Make money delivering orders",
    benefits: [
      "Flexible work hours",
      "Earn per delivery",
      "Real-time earnings",
      "Easy withdrawal",
    ],
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const authResolved = useUserStore((state) => state.authResolved);
  const updateUserRole = useUserStore((state) => state.updateUserRole);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, user, router]);

  useEffect(() => {
    if (!authResolved || !user) return;
    if (user.status !== "active" && user.status !== "suspended") return;
    router.replace(getPostAuthRedirectPath(user));
  }, [authResolved, user, router]);

  if (!authResolved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark py-12 px-4">
        <div className="mx-auto max-w-3xl animate-pulse rounded-xl bg-white/15 p-8 text-white">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedRole !== "customer" && !isProfileComplete(user)) {
        updateUserRole(selectedRole, "pending");
        router.push(profileCompletionPath(`/onboarding/${selectedRole}`, selectedRole));
        return;
      }
      updateUserRole(selectedRole, "pending");
      router.push(`/onboarding/${selectedRole}`);
    } catch (err) {
      toast.error("Failed to select role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-dark py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-white">
            Welcome to UrchenziConnect
          </h1>
          <p className="text-lg text-white/80">
            Hi {user.name.split(" ")[0]}, let's set up your account
          </p>
          <p className="text-white/70">
            Choose how you'd like to use the platform
          </p>
        </div>

        <div className="space-y-4">
          {ROLE_OPTIONS.map((option) => (
            <RoleSelectionCard
              key={option.role}
              icon={option.icon}
              title={option.title}
              description={option.description}
              benefits={option.benefits}
              isSelected={selectedRole === option.role}
              onClick={() => setSelectedRole(option.role)}
            />
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
          className="w-full rounded-lg bg-accent px-8 py-4 text-lg font-bold text-brand hover:bg-white disabled:opacity-50 transition"
        >
          {isLoading ? "Setting up..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
