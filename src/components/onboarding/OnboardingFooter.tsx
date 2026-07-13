import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";
import { OnboardingNavFooter } from "./OnboardingNavFooter";

export function OnboardingFooter() {
  const navigate = useNavigate();
  const { isOnboarding, steps, markComplete, previousStepBefore, nextStepAfter, saving } =
    useOnboarding();
  const { activeStep, readiness, footerSuppressed } = useOnboardingContext();

  if (!isOnboarding || !activeStep || footerSuppressed) return null;

  const step = steps.find((s) => s.key === activeStep);
  if (!step) return null;

  const r = readiness[activeStep] ?? { ready: false };
  const previous = previousStepBefore(activeStep);
  const next = nextStepAfter(activeStep);
  const isAlreadyDone = step.done || step.skipped;

  const goToNextOrDashboard = () => {
    if (next?.href) navigate(next.href);
    else navigate("/dashboard");
  };

  const handleComplete = async () => {
    if (!r.ready && !isAlreadyDone) {
      toast.message(r.hint ?? "Complete this step to continue.");
      return;
    }
    try {
      await markComplete(activeStep);
      const isLast = !next;
      toast.success(isLast ? "Setup complete — welcome to SIA." : `${step.label} step complete.`);
      goToNextOrDashboard();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not complete step";
      toast.error(message);
    }
  };

  return (
    <OnboardingNavFooter
      onBack={() => previous?.href && navigate(previous.href)}
      onContinue={isAlreadyDone ? goToNextOrDashboard : handleComplete}
      canGoBack={!!previous?.href}
      continueDisabled={!isAlreadyDone && (!r.ready || saving)}
    />
  );
}

export default OnboardingFooter;
