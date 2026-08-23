import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";
import { OnboardingNavFooter } from "./OnboardingNavFooter";

export function OnboardingFooter() {
  const navigate = useNavigate();
  const {
    isOnboarding,
    steps,
    markComplete,
    finishSetup,
    previousStepBefore,
    nextStepAfter,
    saving,
  } = useOnboarding();
  const { activeStep, readiness, footerSuppressed } = useOnboardingContext();

  if (!isOnboarding || !activeStep || footerSuppressed) return null;

  const step = steps.find((s) => s.key === activeStep);
  if (!step) return null;

  const r = readiness[activeStep] ?? { ready: false };
  const previous = previousStepBefore(activeStep);
  const next = nextStepAfter(activeStep);
  const isLast = !next;
  const isAlreadyDone = step.done || step.skipped;

  const advance = async () => {
    if (next?.href) {
      navigate(next.href);
      return;
    }
    await finishSetup();
  };

  const handleContinue = async () => {
    try {
      if (!isAlreadyDone) {
        if (!r.ready) {
          toast.message(r.hint ?? "Complete this step to continue.");
          return;
        }
        await markComplete(activeStep);
        if (!isLast) toast.success(`${step.label} step complete.`);
      }
      await advance();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not complete step";
      toast.error(message);
    }
  };

  return (
    <OnboardingNavFooter
      onBack={() => previous?.href && navigate(previous.href)}
      onContinue={handleContinue}
      canGoBack={!!previous?.href}
      continueDisabled={!isAlreadyDone && (!r.ready || saving)}
      continueLabel={isLast ? "Finish setup" : "Continue"}
    />
  );
}

export default OnboardingFooter;
