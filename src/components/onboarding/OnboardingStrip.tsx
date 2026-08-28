import { useLocation } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";
import { OnboardingPipeline } from "./OnboardingPipeline";

export function OnboardingStrip({ className }: { className?: string }) {
  const location = useLocation();
  const { steps, isOnboarding, progressCount, totalSteps } = useOnboarding();
  const { activeStep } = useOnboardingContext();

  // Setup dashboard owns the signature pipeline in its hero card — avoid duplicating it.
  if (!isOnboarding || location.pathname === "/dashboard") return null;

  const active =
    (activeStep && steps.find((s) => s.key === activeStep)) ||
    steps.find((s) => s.status === "current") ||
    steps[0];

  return (
    <div
      className={
        "border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] " +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-2.5 flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <OnboardingPipeline steps={steps} currentKey={active.key} size="sm" />
        </div>
        <p className="text-[11px] text-[hsl(var(--ink-subtle))] tabular-nums shrink-0">
          {progressCount}/{totalSteps}
        </p>
      </div>
    </div>
  );
}

export default OnboardingStrip;
