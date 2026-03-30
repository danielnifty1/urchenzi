"use client";

import { ReactNode } from "react";
import { OnboardingProgress } from "./OnboardingProgress";

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export const OnboardingLayout = ({
  currentStep,
  totalSteps,
  stepName,
  children,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = "Continue",
}: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 to-accent/5 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepName={stepName}
        />

        <div className="rounded-3xl border border-border bg-surface shadow-lg p-8">
          {children}
        </div>

        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 rounded-lg border-2 border-border px-6 py-3 font-semibold text-foreground hover:border-brand hover:bg-brand/5 transition"
            >
              Back
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="flex-1 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
