import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { OnboardingStepKey } from "@/lib/onboardingSteps";
import {
  OnboardingContext,
  type Readiness,
} from "./OnboardingContext";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [readiness, setReadiness] = useState<Partial<Record<OnboardingStepKey, Readiness>>>({});
  const [activeStep, setActiveStep] = useState<OnboardingStepKey | null>(null);
  const [footerSuppressed, setFooterSuppressed] = useState(false);

  const register = useCallback((key: OnboardingStepKey, value: Readiness) => {
    setActiveStep(key);
    setReadiness((previous) => {
      const existing = previous[key];
      if (existing && existing.ready === value.ready && existing.hint === value.hint) return previous;
      return { ...previous, [key]: value };
    });
  }, []);

  const unregister = useCallback((key: OnboardingStepKey) => {
    setActiveStep((current) => (current === key ? null : current));
  }, []);

  const value = useMemo(
    () => ({ activeStep, readiness, footerSuppressed, setFooterSuppressed, register, unregister }),
    [activeStep, readiness, footerSuppressed, register, unregister]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
