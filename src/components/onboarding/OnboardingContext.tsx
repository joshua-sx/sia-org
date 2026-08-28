import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { OnboardingStepKey } from "@/lib/onboardingSteps";

interface Readiness {
  ready: boolean;
  hint?: string;
}

interface OnboardingContextValue {
  activeStep: OnboardingStepKey | null;
  readiness: Partial<Record<OnboardingStepKey, Readiness>>;
  footerSuppressed: boolean;
  setFooterSuppressed: (suppressed: boolean) => void;
  register: (key: OnboardingStepKey, r: Readiness) => void;
  unregister: (key: OnboardingStepKey) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [readiness, setReadiness] = useState<Partial<Record<OnboardingStepKey, Readiness>>>({});
  const [activeStep, setActiveStep] = useState<OnboardingStepKey | null>(null);
  const [footerSuppressed, setFooterSuppressed] = useState(false);

  const register = useCallback((key: OnboardingStepKey, r: Readiness) => {
    setActiveStep(key);
    setReadiness((prev) => {
      const existing = prev[key];
      if (existing && existing.ready === r.ready && existing.hint === r.hint) return prev;
      return { ...prev, [key]: r };
    });
  }, []);

  const unregister = useCallback((key: OnboardingStepKey) => {
    setActiveStep((cur) => (cur === key ? null : cur));
  }, []);

  const value = useMemo(
    () => ({ activeStep, readiness, footerSuppressed, setFooterSuppressed, register, unregister }),
    [activeStep, readiness, footerSuppressed, register, unregister]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboardingContext must be used inside OnboardingProvider");
  return ctx;
}

/** Register the current page as owning a specific onboarding step + its readiness. */
export function useStepReadiness(key: OnboardingStepKey, ready: boolean, hint?: string) {
  const { register, unregister } = useOnboardingContext();
  useEffect(() => {
    register(key, { ready, hint });
    return () => unregister(key);
  }, [key, ready, hint, register, unregister]);
}
