import { createContext, useContext, useEffect } from "react";
import type { OnboardingStepKey } from "@/lib/onboardingSteps";

export interface Readiness {
  ready: boolean;
  hint?: string;
}

export interface OnboardingContextValue {
  activeStep: OnboardingStepKey | null;
  readiness: Partial<Record<OnboardingStepKey, Readiness>>;
  footerSuppressed: boolean;
  setFooterSuppressed: (suppressed: boolean) => void;
  register: (key: OnboardingStepKey, readiness: Readiness) => void;
  unregister: (key: OnboardingStepKey) => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboardingContext must be used inside OnboardingProvider");
  return context;
}

/** Register the current page as owning a specific onboarding step + its readiness. */
export function useStepReadiness(key: OnboardingStepKey, ready: boolean, hint?: string) {
  const { register, unregister } = useOnboardingContext();
  useEffect(() => {
    register(key, { ready, hint });
    return () => unregister(key);
  }, [key, ready, hint, register, unregister]);
}
