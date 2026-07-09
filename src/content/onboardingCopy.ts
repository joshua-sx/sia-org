import type { OnboardingStepKey } from "@/hooks/useOnboarding";

export interface LaunchCopy {
  headline: string;
  subhead: string;
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
}

export const LAUNCH_COPY: Record<OnboardingStepKey, LaunchCopy> = {
  account: {
    headline: "Finish setting up your account",
    subhead: "Confirm your profile so we can personalize your workspace.",
    ctaTitle: "Complete your account",
    ctaBody: "Add your details to unlock the rest of the setup flow.",
    ctaLabel: "Continue",
  },
  structure: {
    headline: "Shape your organization",
    subhead:
      "Define the levels of your organization — divisions, departments, teams — so reviews reflect how your company actually works.",
    ctaTitle: "Set up your organization structure",
    ctaBody:
      "Pick a template or design your own levels, then add the first units. You can always expand it later.",
    ctaLabel: "Continue",
  },
  people: {
    headline: "Add your team to keep things moving",
    subhead:
      "Bring in the people who will take part in appraisal cycles. Import a CSV or add them one at a time.",
    ctaTitle: "Add your employees",
    ctaBody:
      "Give each person a role and a manager so review workflows can route automatically.",
    ctaLabel: "Continue",
  },
  cycle: {
    headline: "You're one step away from launching reviews",
    subhead:
      "Your organization profile, structure, and employee data are ready. Create your first appraisal cycle to define how reviews will run.",
    ctaTitle: "Create your first appraisal cycle",
    ctaBody:
      "Set the review timeline, then resolve participants and managers before you launch. You'll review everything before invitations go out.",
    ctaLabel: "Continue",
  },
};

/** Mirrors the real flow: CycleFormModal (timeline) → AppraisalCycleDetail (participants + launch). */
export const CYCLE_SUBSTEPS = [
  "Create the cycle and its review timeline",
  "Resolve participants and managers, then launch",
];
