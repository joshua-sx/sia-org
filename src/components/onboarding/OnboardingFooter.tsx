import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/useOnboarding";
import { playSetupCompleteCue, playSuccessCue } from "@/lib/completionSounds";
import { friendlyError } from "@/lib/siaErrors";
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
    playSetupCompleteCue();
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
        if (!isLast) playSuccessCue();
      }
      await advance();
    } catch (e: unknown) {
      toast.error(friendlyError(e, "Could not complete step"));
    }
  };

  const continueLabel = isLast ? "Finish setup" : `Continue to ${next.label}`;

  return (
    <OnboardingNavFooter
      onBack={() => previous?.href && navigate(previous.href)}
      onContinue={() => void handleContinue()}
      canGoBack={!!previous?.href}
      continueDisabled={!isAlreadyDone && (!r.ready || saving)}
      continueLabel={continueLabel}
      hint={isAlreadyDone ? undefined : r.hint}
    />
  );
}

export default OnboardingFooter;
