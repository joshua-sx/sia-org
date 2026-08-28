import {
  Building2,
  CalendarClock,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type OnboardingStepKey = "account" | "structure" | "people" | "cycle";
export type OnboardingStatus = "done" | "current" | "next" | "skipped";

export interface OnboardingStepDefinition {
  key: OnboardingStepKey;
  label: string;
  accent: string;
  href: string;
  icon: LucideIcon;
}

export interface OnboardingStep extends OnboardingStepDefinition {
  status: OnboardingStatus;
  skipped: boolean;
  done: boolean;
}

export interface OnboardingStepCompletion {
  done: boolean;
  skipped: boolean;
}

export type OnboardingCompletionByStep = Record<
  OnboardingStepKey,
  OnboardingStepCompletion
>;

export const ONBOARDING_STEPS = [
  {
    key: "account",
    label: "Account",
    accent: "--accent-blue",
    href: "/onboarding/setup",
    icon: UserCircle2,
  },
  {
    key: "structure",
    label: "Structure",
    accent: "--accent-red",
    href: "/org/structure",
    icon: Building2,
  },
  {
    key: "people",
    label: "People",
    accent: "--accent-purple",
    href: "/org/employees",
    icon: Users,
  },
  {
    key: "cycle",
    label: "Cycle",
    accent: "--accent-green",
    href: "/appraisals",
    icon: CalendarClock,
  },
] as const satisfies readonly OnboardingStepDefinition[];

export function deriveOnboardingSteps(
  completion: OnboardingCompletionByStep,
): OnboardingStep[] {
  const currentKey = ONBOARDING_STEPS.find(({ key }) => {
    const step = completion[key];
    return !step.done && !step.skipped;
  })?.key;

  return ONBOARDING_STEPS.map((definition) => {
    const step = completion[definition.key];
    const status: OnboardingStatus = step.done
      ? "done"
      : step.skipped
        ? "skipped"
        : definition.key === currentKey
          ? "current"
          : "next";

    return {
      ...definition,
      status,
      done: step.done,
      skipped: step.skipped,
    };
  });
}

export function deriveOnboardingProgress(steps: readonly OnboardingStep[]) {
  return {
    resolvedCount: steps.filter((step) => step.done || step.skipped).length,
    totalSteps: steps.length,
  };
}

export function onboardingStepIndex(key: OnboardingStepKey): number {
  return ONBOARDING_STEPS.findIndex((step) => step.key === key);
}
