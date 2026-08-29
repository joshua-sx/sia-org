import type { CycleStatus } from "@/lib/cycleSchema";

export interface HrDashboardCycle {
  id: string;
  name: string;
  status: CycleStatus;
}

export interface HrDashboardNextAction {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  cycleStatus: CycleStatus | null;
}

/** Next action for an HR admin after setup — never a dead-end checklist. */
export function hrDashboardNextAction(
  cycles: readonly HrDashboardCycle[],
): HrDashboardNextAction {
  const active = cycles.find((cycle) => cycle.status === "active");
  if (active) {
    return {
      title: `${active.name} is running`,
      description: "Open the cycle to track goals, assessments, and sign-off.",
      href: `/appraisals/${active.id}`,
      ctaLabel: "Open cycle",
      cycleStatus: "active",
    };
  }

  const draft = cycles.find((cycle) => cycle.status === "draft");
  if (draft) {
    return {
      title: `Launch ${draft.name}`,
      description: "Your first cycle is drafted. Open it to review people and launch reviews.",
      href: `/appraisals/${draft.id}`,
      ctaLabel: "Open cycle",
      cycleStatus: "draft",
    };
  }

  const completed = cycles.find((cycle) => cycle.status === "completed");
  if (completed) {
    return {
      title: "Start the next cycle",
      description: `${completed.name} is closed. Create a new cycle when you're ready.`,
      href: "/appraisals",
      ctaLabel: "Open appraisals",
      cycleStatus: "completed",
    };
  }

  return {
    title: "Run your first appraisal cycle",
    description: "Create a cycle, add the timeline, and launch when the people list is ready.",
    href: "/appraisals",
    ctaLabel: "Create a cycle",
    cycleStatus: null,
  };
}
