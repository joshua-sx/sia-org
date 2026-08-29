import { describe, expect, it } from "vitest";
import { Building2, CalendarClock, UserCircle2, Users } from "lucide-react";
import {
  ONBOARDING_STEPS,
  deriveOnboardingProgress,
  deriveOnboardingSteps,
  incompleteOnboardingResumeHref,
  type OnboardingCompletionByStep,
} from "@/lib/onboardingSteps";

function completion(
  overrides: Partial<OnboardingCompletionByStep> = {},
): OnboardingCompletionByStep {
  return {
    account: { done: true, skipped: false },
    structure: { done: false, skipped: false },
    people: { done: false, skipped: false },
    cycle: { done: false, skipped: false },
    ...overrides,
  };
}

describe("onboarding step definitions", () => {
  it("keeps the shipped order and display labels canonical", () => {
    expect(ONBOARDING_STEPS.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: "account", label: "Account" },
      { key: "structure", label: "Structure" },
      { key: "people", label: "People" },
      { key: "cycle", label: "Cycle" },
    ]);
  });

  it("provides navigation, accents, and icons for every step", () => {
    expect(
      ONBOARDING_STEPS.map(({ href, accent, icon }) => ({
        href,
        accent,
        icon,
      })),
    ).toEqual([
      {
        href: "/onboarding/setup",
        accent: "--accent-blue",
        icon: UserCircle2,
      },
      {
        href: "/org/structure",
        accent: "--accent-red",
        icon: Building2,
      },
      {
        href: "/org/employees",
        accent: "--accent-purple",
        icon: Users,
      },
      {
        href: "/appraisals",
        accent: "--accent-green",
        icon: CalendarClock,
      },
    ]);
  });
});

describe("deriveOnboardingSteps", () => {
  it("marks the first unresolved step current and later steps next", () => {
    const steps = deriveOnboardingSteps(completion());

    expect(steps.map((step) => step.status)).toEqual([
      "done",
      "current",
      "next",
      "next",
    ]);
  });

  it("preserves canonical labels while deriving done and skipped statuses", () => {
    const steps = deriveOnboardingSteps(
      completion({
        structure: { done: false, skipped: true },
        people: { done: true, skipped: false },
      }),
    );

    expect(steps.map((step) => step.label)).toEqual(
      ONBOARDING_STEPS.map((step) => step.label),
    );
    expect(steps.map((step) => step.status)).toEqual([
      "done",
      "skipped",
      "done",
      "current",
    ]);
  });

  it("has no current step once every step is resolved", () => {
    const steps = deriveOnboardingSteps(
      completion({
        structure: { done: true, skipped: false },
        people: { done: false, skipped: true },
        cycle: { done: true, skipped: false },
      }),
    );

    expect(steps.some((step) => step.status === "current")).toBe(false);
  });
});

describe("incompleteOnboardingResumeHref", () => {
  it("sends an incomplete setup to the first unresolved step", () => {
    const steps = deriveOnboardingSteps(
      completion({
        structure: { done: true, skipped: false },
      }),
    );

    expect(incompleteOnboardingResumeHref(steps)).toBe("/org/employees");
  });

  it("resumes on Cycle when every step is already done or skipped", () => {
    const steps = deriveOnboardingSteps(
      completion({
        structure: { done: true, skipped: false },
        people: { done: true, skipped: false },
        cycle: { done: true, skipped: false },
      }),
    );

    expect(incompleteOnboardingResumeHref(steps)).toBe("/appraisals");
  });
});

describe("deriveOnboardingProgress", () => {
  it("counts skipped steps as resolved progress", () => {
    const steps = deriveOnboardingSteps(
      completion({
        structure: { done: false, skipped: true },
        people: { done: true, skipped: false },
      }),
    );

    expect(deriveOnboardingProgress(steps)).toEqual({
      resolvedCount: 3,
      totalSteps: 4,
    });
  });
});
