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
    headline: "Set up your workspace",
    subhead: "Three short steps and you are ready to run reviews.",
    ctaTitle: "Set up your workspace",
    ctaBody: "Three short steps and you are ready to run reviews.",
    ctaLabel: "Continue",
  },
  structure: {
    headline: "Shape your organization",
    subhead: "Set up divisions, departments and teams so reviews follow your real structure.",
    ctaTitle: "Build your organization",
    ctaBody: "Start with a template or your own levels. You can change it later.",
    ctaLabel: "Continue",
  },
  people: {
    headline: "Add your people",
    subhead: "Import a spreadsheet or add people one at a time.",
    ctaTitle: "Add your people",
    ctaBody: "Give each person a manager so reviews know where to go.",
    ctaLabel: "Continue",
  },
  cycle: {
    headline: "Create your first cycle",
    subhead: "Set the timeline and stages for your first round of reviews.",
    ctaTitle: "Create your first cycle",
    ctaBody: "Set the timeline and stages. Nothing is sent yet.",
    ctaLabel: "Continue",
  },
};

/** Mirrors the real flow: CycleFormModal (timeline) → AppraisalCycleDetail (participants + launch). */
export const CYCLE_SUBSTEPS = [
  "Create the cycle and its review timeline",
  "Resolve participants and managers, then launch",
];
