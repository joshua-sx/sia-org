import { UserCircle2, Building2, Users, CalendarClock } from "lucide-react";
import type { CompletionCriterion } from "@/components/onboarding/CompletionCriteria";
import type { OnboardingStep, OnboardingStepKey } from "@/hooks/useOnboarding";

export type PreviewScreenId =
  | "account"
  | "structure"
  | "people-import"
  | "people-validation"
  | "launch-setup"
  | "launch-review"
  | "complete"
  | "dashboard";

export const SCREEN_ORDER: PreviewScreenId[] = [
  "account",
  "structure",
  "people-import",
  "people-validation",
  "launch-setup",
  "launch-review",
  "complete",
  "dashboard",
];

export interface ValidationIssue {
  id: string;
  name: string;
  issue: string;
  fixed: boolean;
}

export interface PreviewFlowState {
  screenId: PreviewScreenId;
  importChecked: boolean;
  validationIssues: ValidationIssue[];
  peopleSkipped: boolean;
  launchSkipped: boolean;
  cycleName: string;
  cycleStart: string;
  cycleEnd: string;
  launchFormSaved: boolean;
  launched: boolean;
}

export const INITIAL_VALIDATION_ISSUES: ValidationIssue[] = [
  { id: "james", name: "James Laurent", issue: "No manager assigned", fixed: false },
  { id: "maria", name: "Maria Francis", issue: "Reports to unknown employee", fixed: false },
];

export function createInitialFlowState(): PreviewFlowState {
  return {
    screenId: "account",
    importChecked: false,
    validationIssues: INITIAL_VALIDATION_ISSUES.map((i) => ({ ...i })),
    peopleSkipped: false,
    launchSkipped: false,
    cycleName: "",
    cycleStart: "",
    cycleEnd: "",
    launchFormSaved: false,
    launched: false,
  };
}

/** Prefilled state for previewing the post-launch completion screen. */
export function createCompletedFlowState(
  screenId: "complete" | "dashboard" = "complete"
): PreviewFlowState {
  return {
    screenId,
    importChecked: true,
    validationIssues: INITIAL_VALIDATION_ISSUES.map((i) => ({ ...i, fixed: true })),
    peopleSkipped: false,
    launchSkipped: false,
    cycleName: "FY 2026 Annual Review",
    cycleStart: "Jul 1, 2026",
    cycleEnd: "Sep 30, 2026",
    launchFormSaved: true,
    launched: true,
  };
}

export interface DerivedScreen {
  id: PreviewScreenId;
  label: string;
  globalStep: 1 | 2 | 3 | 4;
  completedThrough: number;
  eyebrow: string;
  eyebrowAccent: string;
  title: string;
  subtitle: string;
  localStepLabel?: string;
  criteria?: CompletionCriterion[];
  /** Shown inline next to the disabled Continue button */
  blockedHint: string;
  footerReady: boolean;
  showSkip: boolean;
}

export const SCREEN_LABELS: Record<PreviewScreenId, string> = {
  account: "01 Account",
  structure: "02 Structure",
  "people-import": "03 People · Import",
  "people-validation": "04 People · Validation",
  "launch-setup": "05 Launch · Setup",
  "launch-review": "06 Launch · Review",
  complete: "07 Complete",
  dashboard: "08 Dashboard",
};

export function deriveScreen(state: PreviewFlowState): DerivedScreen {
  const openIssues = state.validationIssues.filter((i) => !i.fixed);
  const peopleComplete =
    state.peopleSkipped || (state.importChecked && openIssues.length === 0);

  switch (state.screenId) {
    case "account":
      return {
        id: "account",
        label: SCREEN_LABELS.account,
        globalStep: 1,
        completedThrough: 0,
        eyebrow: "ACCOUNT",
        eyebrowAccent: "--accent-blue",
        title: "Confirm your account",
        subtitle: "Check your organization details.",
        criteria: [
          { label: "Organization name is set", met: true },
          { label: "Industry and country selected", met: true },
        ],
        blockedHint: "Confirm your organization details.",
        footerReady: true,
        showSkip: false,
      };

    case "structure":
      return {
        id: "structure",
        label: SCREEN_LABELS.structure,
        globalStep: 2,
        completedThrough: 1,
        eyebrow: "STRUCTURE",
        eyebrowAccent: "--accent-red",
        title: "Build your organization",
        subtitle: "Add levels first, then place your units.",
        criteria: [
          { label: "At least 2 levels defined", met: true },
          { label: "At least 1 unit created", met: true },
        ],
        blockedHint: "",
        footerReady: true,
        showSkip: false,
      };

    case "people-import":
      return {
        id: "people-import",
        label: SCREEN_LABELS["people-import"],
        globalStep: 3,
        completedThrough: 2,
        eyebrow: "PEOPLE",
        eyebrowAccent: "--accent-purple",
        title: "Add your team",
        subtitle: "Import a CSV or add people manually.",
        criteria: [
          { label: "CSV uploaded and checked", met: state.importChecked },
          { label: "Every employee has a unit", met: state.importChecked },
          { label: "Every employee has a manager", met: peopleComplete },
        ],
        blockedHint: "Check your CSV file first.",
        footerReady: state.importChecked,
        showSkip: true,
      };

    case "people-validation": {
      const readyCount = 84 - openIssues.length;
      return {
        id: "people-validation",
        label: SCREEN_LABELS["people-validation"],
        globalStep: 3,
        completedThrough: 2,
        eyebrow: "PEOPLE",
        eyebrowAccent: "--accent-purple",
        localStepLabel: "PEOPLE · CHECK 3 OF 3",
        title:
          openIssues.length > 0
            ? `Fix ${openIssues.length} reporting line${openIssues.length === 1 ? "" : "s"}`
            : "All employees are ready",
        subtitle:
          openIssues.length > 0
            ? `${readyCount} employees are ready. Resolve the rows below.`
            : "Every employee has a unit and manager. You can continue.",
        criteria: [
          { label: "Every employee has a unit", met: true },
          { label: "Every employee has a manager", met: openIssues.length === 0 },
          { label: "No duplicate emails", met: true },
        ],
        blockedHint: "Fix the reporting issues above.",
        footerReady: openIssues.length === 0,
        showSkip: true,
      };
    }

    case "launch-setup":
      return {
        id: "launch-setup",
        label: SCREEN_LABELS["launch-setup"],
        globalStep: 4,
        completedThrough: 3,
        eyebrow: "LAUNCH",
        eyebrowAccent: "--accent-green",
        localStepLabel: "LAUNCH · DETAILS 1 OF 2",
        title: "Create your first cycle",
        subtitle: "Set the name, scoring, and review windows.",
        criteria: [
          { label: "Cycle name and dates set", met: state.launchFormSaved },
          { label: "All participants have managers", met: peopleComplete },
          { label: "Review windows configured", met: state.launchFormSaved },
        ],
        blockedHint: "Save your cycle details first.",
        footerReady: state.launchFormSaved,
        showSkip: true,
      };

    case "launch-review":
      return {
        id: "launch-review",
        label: SCREEN_LABELS["launch-review"],
        globalStep: 4,
        completedThrough: 3,
        eyebrow: "LAUNCH",
        eyebrowAccent: "--accent-green",
        localStepLabel: "LAUNCH · REVIEW 2 OF 2",
        title: "Review and launch",
        subtitle: "Everything is ready. Nothing is sent until you confirm.",
        criteria: [
          { label: "Structure complete", met: true },
          { label: "People imported", met: peopleComplete },
          { label: "Cycle configured", met: state.launchFormSaved || state.launchSkipped },
        ],
        blockedHint: "",
        footerReady: true,
        showSkip: false,
      };

    case "complete":
      return {
        id: "complete",
        label: SCREEN_LABELS.complete,
        globalStep: 4,
        completedThrough: 4,
        eyebrow: "SETUP COMPLETE",
        eyebrowAccent: "--accent-green",
        title: "You're ready to launch",
        subtitle: "Your workspace is configured. Head to the dashboard to manage cycles.",
        blockedHint: "",
        footerReady: true,
        showSkip: false,
      };

    case "dashboard":
      return {
        id: "dashboard",
        label: SCREEN_LABELS.dashboard,
        globalStep: 4,
        completedThrough: 4,
        eyebrow: "OVERVIEW",
        eyebrowAccent: "--accent-blue",
        title: "Welcome back",
        subtitle: "You're all set. Ready to run your first appraisal cycle.",
        blockedHint: "",
        footerReady: true,
        showSkip: false,
      };

    default: {
      const _exhaustive: never = state.screenId;
      return _exhaustive;
    }
  }
}

export const PIPELINE_KEY_BY_GLOBAL_STEP: Record<1 | 2 | 3 | 4, OnboardingStepKey> = {
  1: "account",
  2: "structure",
  3: "people",
  4: "cycle",
};

const PIPELINE_STEP_META: { key: OnboardingStepKey; label: string; icon: OnboardingStep["icon"]; accent: string }[] = [
  { key: "account", label: "Account", icon: UserCircle2, accent: "--accent-blue" },
  { key: "structure", label: "Structure", icon: Building2, accent: "--accent-red" },
  { key: "people", label: "People", icon: Users, accent: "--accent-purple" },
  { key: "cycle", label: "Launch", icon: CalendarClock, accent: "--accent-green" },
];

/** Build a mock OnboardingStep[] for OnboardingPipeline from the preview's simplified progress state.
 * No href — these nodes are illustrative only in the dev preview, not real navigation targets. */
export function pipelineStepsFor(globalStep: 1 | 2 | 3 | 4, completedThrough: number): OnboardingStep[] {
  return PIPELINE_STEP_META.map((meta, i) => {
    const stepNum = i + 1;
    const done = stepNum <= completedThrough;
    const current = !done && stepNum === globalStep;
    return {
      ...meta,
      status: done ? "done" : current ? "current" : "next",
      skipped: false,
      done,
    };
  });
}

export function screenIndex(id: PreviewScreenId): number {
  return SCREEN_ORDER.indexOf(id);
}

export function nextScreenId(id: PreviewScreenId): PreviewScreenId | null {
  const i = screenIndex(id);
  return i >= 0 && i < SCREEN_ORDER.length - 1 ? SCREEN_ORDER[i + 1] : null;
}

export function prevScreenId(id: PreviewScreenId): PreviewScreenId | null {
  const i = screenIndex(id);
  return i > 0 ? SCREEN_ORDER[i - 1] : null;
}

/** Skip jumps past the current main step's remaining screens */
export function skipTargetFrom(id: PreviewScreenId): PreviewScreenId {
  switch (id) {
    case "people-import":
    case "people-validation":
      return "launch-setup";
    case "launch-setup":
      return "complete";
    case "launch-review":
      return "complete";
    default:
      return nextScreenId(id) ?? "complete";
  }
}
