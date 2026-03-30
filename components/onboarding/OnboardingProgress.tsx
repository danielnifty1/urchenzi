"use client";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

export const OnboardingProgress = ({
  currentStep,
  totalSteps,
  stepName,
}: OnboardingProgressProps) => {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{stepName}</h2>
        <span className="text-sm font-semibold text-muted">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand to-accent transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
