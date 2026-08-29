import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";
import { formatDate, formatWindow, todayISO } from "@/lib/cycleSchema";

export type BriefingPhaseState = "done" | "current" | "upcoming";

export interface BriefingPhase {
  id: "goals" | "interim" | "final" | "acknowledgement";
  label: string;
  dates: string;
  state: BriefingPhaseState;
}

export interface BriefingDeadline {
  label: string;
  date: string;
  daysAway: number;
}

export interface BriefingAttentionItem {
  id: string;
  label: string;
  description: string;
  count: number;
  href: string;
  tone: "warning" | "info" | "success";
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return Math.max(0, Math.ceil((toDate.getTime() - fromDate.getTime()) / DAY_MS));
}

export function selectBriefingCycle(cycles: AppraisalCycle[]) {
  return (
    cycles.find((cycle) => cycle.status === "active") ??
    cycles.find((cycle) => cycle.status === "draft") ??
    cycles[0] ??
    null
  );
}

export function buildBriefingPhases(
  cycle: AppraisalCycle,
  today = todayISO(),
): BriefingPhase[] {
  const phases = [
    {
      id: "goals" as const,
      label: "Goal setting",
      start: cycle.goal_window_start,
      end: cycle.goal_window_end,
      dates: formatWindow(cycle.goal_window_start, cycle.goal_window_end),
    },
    {
      id: "interim" as const,
      label: "Interim assessment",
      start: cycle.interim_window_start,
      end: cycle.interim_window_end,
      dates: formatWindow(cycle.interim_window_start, cycle.interim_window_end),
    },
    {
      id: "final" as const,
      label: "Final assessment",
      start: cycle.final_window_start,
      end: cycle.final_window_end,
      dates: formatWindow(cycle.final_window_start, cycle.final_window_end),
    },
    {
      id: "acknowledgement" as const,
      label: "Acknowledgement",
      start: cycle.final_window_end,
      end: cycle.acknowledgement_due,
      dates: `Due ${formatDate(cycle.acknowledgement_due)}`,
    },
  ];

  if (cycle.status === "completed") {
    return phases.map(({ id, label, dates }) => ({ id, label, dates, state: "done" }));
  }

  if (cycle.status === "draft") {
    return phases.map(({ id, label, dates }) => ({ id, label, dates, state: "upcoming" }));
  }

  let currentAssigned = false;
  return phases.map(({ id, label, start, end, dates }) => {
    let state: BriefingPhaseState;
    if (today > end) {
      state = "done";
    } else if (!currentAssigned && today >= start) {
      state = "current";
      currentAssigned = true;
    } else if (!currentAssigned && today < start) {
      state = "current";
      currentAssigned = true;
    } else {
      state = "upcoming";
    }
    return { id, label, dates, state };
  });
}

export function getBriefingDeadline(
  cycle: AppraisalCycle,
  today = todayISO(),
): BriefingDeadline | null {
  const deadlines = [
    { label: "Goal setting ends", date: cycle.goal_window_end },
    { label: "Interim assessment ends", date: cycle.interim_window_end },
    { label: "Final assessment ends", date: cycle.final_window_end },
    { label: "Acknowledgement is due", date: cycle.acknowledgement_due },
  ];
  const next = deadlines.find((deadline) => deadline.date >= today);
  if (!next) return null;
  return { ...next, daysAway: daysBetween(today, next.date) };
}

export function getBriefingStage(cycle: AppraisalCycle, today = todayISO()) {
  if (cycle.status === "draft") return "Launch readiness";
  if (cycle.status === "completed") return "Cycle complete";
  const current = buildBriefingPhases(cycle, today).find((phase) => phase.state === "current");
  return current?.label ?? "Cycle follow-up";
}

export function buildBriefingAttention(
  cycle: AppraisalCycle,
  employees: Employee[],
  participants: CycleParticipant[],
  today = todayISO(),
): BriefingAttentionItem[] {
  const cycleHref = `/appraisals/${cycle.id}`;
  const activeEmployees = employees.filter((employee) => employee.employment_status === "active");
  const missingManagers = activeEmployees.filter((employee) => !employee.manager_id).length;

  if (cycle.status === "completed") {
    const reviewed = participants.filter((participant) => participant.final_submitted_at).length;
    const acknowledged = participants.filter((participant) => participant.acknowledged_at).length;
    return [
      {
        id: "reviews-completed",
        label: "Final reviews recorded",
        description: "Completed assessment records are preserved with the cycle.",
        count: reviewed,
        href: cycleHref,
        tone: "success",
      },
      {
        id: "acknowledgements-recorded",
        label: "Acknowledgements recorded",
        description: "Employee acknowledgements remain available for audit and reporting.",
        count: acknowledged,
        href: cycleHref,
        tone: "success",
      },
      {
        id: "cycle-record",
        label: "Cycle record",
        description: "Review the permanent activity trail and final reports.",
        count: 1,
        href: cycleHref,
        tone: "info",
      },
    ];
  }

  if (cycle.status === "draft") {
    return [
      {
        id: "missing-managers",
        label: "Employees missing managers",
        description:
          missingManagers > 0
            ? "Assign a manager or exclude the employee before launch."
            : "Every active employee has a manager assigned.",
        count: missingManagers,
        href: "/org/employees",
        tone: missingManagers > 0 ? "warning" : "success",
      },
      {
        id: "participant-readiness",
        label: "Participant list",
        description: `${activeEmployees.length} active ${activeEmployees.length === 1 ? "employee is" : "employees are"} available for this cycle.`,
        count: activeEmployees.length,
        href: cycleHref,
        tone: "info",
      },
      {
        id: "launch-review",
        label: "Launch review",
        description: "Confirm the timeline and participant scope before anything is sent.",
        count: 1,
        href: cycleHref,
        tone: "info",
      },
    ];
  }

  const activeParticipants = participants.filter(
    (participant) => participant.employee.employment_status !== "terminated",
  );
  const interimOpenOrPast = today >= cycle.interim_window_start;
  const finalOpenOrPast = today >= cycle.final_window_start;
  const acknowledgementOpenOrPast = today >= cycle.final_window_end;

  const interimRemaining = activeParticipants.filter(
    (participant) => !participant.interim_submitted_at,
  ).length;
  const finalRemaining = activeParticipants.filter(
    (participant) => !participant.final_submitted_at,
  ).length;
  const acknowledgementRemaining = activeParticipants.filter(
    (participant) => !participant.acknowledged_at,
  ).length;

  const included = new Set(activeParticipants.map((participant) => participant.employee_id));
  const excluded = activeEmployees.filter((employee) => !included.has(employee.id)).length;

  const stageItem = finalOpenOrPast
    ? {
        id: "final-reviews",
        label: "Final assessments outstanding",
        description: "Review final submissions and follow up before acknowledgement.",
        count: finalRemaining,
        tone: today > cycle.final_window_end && finalRemaining > 0 ? "warning" as const : "info" as const,
      }
    : {
        id: "self-reviews",
        label: "Interim assessments outstanding",
        description: "Follow up with managers to keep the review window moving.",
        count: interimRemaining,
        tone: interimOpenOrPast && today > cycle.interim_window_end && interimRemaining > 0
          ? "warning" as const
          : "info" as const,
      };

  const finalItem = acknowledgementOpenOrPast
    ? {
        id: "acknowledgements",
        label: "Acknowledgements pending",
        description: "Employees still need to acknowledge their completed review.",
        count: acknowledgementRemaining,
        tone: today > cycle.acknowledgement_due && acknowledgementRemaining > 0
          ? "warning" as const
          : "info" as const,
      }
    : {
        id: "cycle-scope",
        label: "Employees outside this cycle",
        description: excluded > 0
          ? "Review excluded employees before the next appraisal stage."
          : "Every active employee is included in this cycle.",
        count: excluded,
        tone: excluded > 0 ? "warning" as const : "success" as const,
      };

  return [
    {
      ...stageItem,
      href: cycleHref,
    },
    {
      ...finalItem,
      href: cycleHref,
    },
    {
      id: "participant-coverage",
      label: "Participants in cycle",
      description: `${activeParticipants.length} people are being tracked in this review cycle.`,
      count: activeParticipants.length,
      href: cycleHref,
      tone: "success",
    },
  ];
}
