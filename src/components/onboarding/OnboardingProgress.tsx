import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";
import { GlobalStepBar } from "./GlobalStepBar";

export function OnboardingProgress() {
  const { steps, isOnboarding, stepIndexByKey } = useOnboarding();
  const { activeStep } = useOnboardingContext();

  if (!isOnboarding) return null;

  const activeIndex =
    activeStep != null
      ? stepIndexByKey(activeStep)
      : steps.findIndex((s) => s.status === "current");

  const activeStepNum = (Math.max(0, activeIndex) + 1) as 1 | 2 | 3 | 4;
  const completedThrough = steps.filter((s) => s.done).length;

  return <GlobalStepBar activeStep={activeStepNum} completedThrough={completedThrough} />;
}

export default OnboardingProgress;
