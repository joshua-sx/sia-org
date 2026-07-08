import { describe, it, expect } from "vitest";
import {
  getEmployeeAppraisalSteps,
  getHrCycleSteps,
  getManagerAppraisalSteps,
} from "@/lib/appraisalProgress";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Goal } from "@/hooks/useGoals";

function makeCycle(overrides: Partial<AppraisalCycle> = {}): AppraisalCycle {
  return {
    id: "cycle-1",
    organization_id: "org-1",
    name: "Q3 2026",
    status: "active",
    goal_window_start: "2026-07-01",
    goal_window_end: "2026-07-07",
    interim_window_start: "2026-08-01",
    interim_window_end: "2026-08-07",
    final_window_start: "2026-09-01",
    final_window_end: "2026-09-07",
    acknowledgement_due: "2026-09-30",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function makeParticipant(overrides: Partial<CycleParticipant> = {}): CycleParticipant {
  const person = {
    id: "e1",
    first_name: "Maria",
    last_name: "Peterson",
    job_title: "Ops",
    employment_status: "active" as const,
  };
  return {
    id: "p1",
    cycle_id: "cycle-1",
    employee_id: "e1",
    manager_id: "m1",
    extra_reviewer_id: null,
    interim_submitted_at: null,
    final_submitted_at: null,
    interim_score: null,
    final_score: null,
    overall_score: null,
    acknowledged_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    employee: person,
    manager: { ...person, id: "m1" },
    extra_reviewer: null,
    ...overrides,
  };
}

function makeGoals(count: number, weight = 100): Goal[] {
  if (count === 0) return [];
  const each = Math.floor(weight / count);
  return Array.from({ length: count }, (_, i) => ({
    id: `g${i}`,
    participant_id: "p1",
    title: `Goal ${i}`,
    description: null,
    weight: i === count - 1 ? weight - each * (count - 1) : each,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  }));
}

const statuses = (steps: { status: string }[]) => steps.map((s) => s.status);
const activeStep = (steps: { status: string; label: string }[]) =>
  steps.find((s) => s.status === "active");

describe("getHrCycleSteps", () => {
  it("marks only Configure done and Assign goals active when nothing has progressed", () => {
    const steps = getHrCycleSteps({
      active: 30,
      goalsReady: 0,
      interimDone: 0,
      finalDone: 0,
      acknowledged: 0,
      cycleStatus: "active",
    });
    expect(statuses(steps)).toEqual([
      "done",
      "active",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
    expect(activeStep(steps)?.sub).toBe("0/30 with goals");
  });

  it("advances to interim with a fan-out sub once goals are all set", () => {
    const steps = getHrCycleSteps({
      active: 30,
      goalsReady: 30,
      interimDone: 18,
      finalDone: 0,
      acknowledged: 0,
      cycleStatus: "active",
    });
    const active = activeStep(steps);
    expect(active?.label).toBe("Interim assessments");
    expect(active?.sub).toBe("18/30 submitted");
  });

  it("closes every step when the cycle is completed", () => {
    const steps = getHrCycleSteps({
      active: 30,
      goalsReady: 30,
      interimDone: 30,
      finalDone: 30,
      acknowledged: 30,
      cycleStatus: "completed",
    });
    expect(statuses(steps).every((s) => s === "done")).toBe(true);
  });

  it("does not mark phases done when there are zero active participants", () => {
    const steps = getHrCycleSteps({
      active: 0,
      goalsReady: 0,
      interimDone: 0,
      finalDone: 0,
      acknowledged: 0,
      cycleStatus: "active",
    });
    expect(activeStep(steps)?.label).toBe("Assign goals");
    expect(activeStep(steps)?.sub).toBeUndefined();
  });
});

describe("getManagerAppraisalSteps", () => {
  it("starts on Set goals when goals are not fully weighted", () => {
    const steps = getManagerAppraisalSteps({
      participant: makeParticipant(),
      cycle: makeCycle(),
      goals: makeGoals(2, 80),
    });
    expect(activeStep(steps)?.label).toBe("Set goals");
  });

  it("advances to interim submission once goals total 100%", () => {
    const steps = getManagerAppraisalSteps({
      participant: makeParticipant(),
      cycle: makeCycle(),
      goals: makeGoals(2, 100),
    });
    expect(activeStep(steps)?.label).toBe("Submit interim assessment");
  });

  it("waits on employee acknowledgement after final submission", () => {
    const steps = getManagerAppraisalSteps({
      participant: makeParticipant({
        interim_submitted_at: "2026-08-05T00:00:00Z",
        final_submitted_at: "2026-09-05T00:00:00Z",
      }),
      cycle: makeCycle(),
      goals: makeGoals(2, 100),
    });
    expect(activeStep(steps)?.label).toBe("Employee acknowledgement");
  });

  it("is fully done once acknowledged", () => {
    const steps = getManagerAppraisalSteps({
      participant: makeParticipant({
        interim_submitted_at: "2026-08-05T00:00:00Z",
        final_submitted_at: "2026-09-05T00:00:00Z",
        acknowledged_at: "2026-09-10T00:00:00Z",
      }),
      cycle: makeCycle(),
      goals: makeGoals(2, 100),
    });
    expect(statuses(steps).every((s) => s === "done")).toBe(true);
  });
});

describe("getEmployeeAppraisalSteps", () => {
  it("starts on Goals assigned with no goals yet", () => {
    const steps = getEmployeeAppraisalSteps({
      goals: [],
      participant: makeParticipant(),
    });
    expect(activeStep(steps)?.label).toBe("Goals assigned");
  });

  it("attaches an action chip once acknowledgement is possible", () => {
    const steps = getEmployeeAppraisalSteps({
      goals: makeGoals(2, 100),
      participant: makeParticipant({
        final_submitted_at: "2026-09-05T00:00:00Z",
        overall_score: 3.5,
      }),
    });
    const active = activeStep(steps);
    expect(active?.label).toBe("Acknowledge review");
    expect(active?.action).toEqual({ label: "Review & sign", href: "/appraisals/my-review" });
  });

  it("shows a waiting sub when the manager review is not in yet", () => {
    const steps = getEmployeeAppraisalSteps({
      goals: makeGoals(2, 100),
      participant: makeParticipant(),
    });
    const active = activeStep(steps);
    expect(active?.label).toBe("Manager review");
    expect(active?.action).toBeUndefined();
  });

  it("is fully done once acknowledged", () => {
    const steps = getEmployeeAppraisalSteps({
      goals: makeGoals(2, 100),
      participant: makeParticipant({
        final_submitted_at: "2026-09-05T00:00:00Z",
        overall_score: 3.5,
        acknowledged_at: "2026-09-10T00:00:00Z",
      }),
    });
    expect(statuses(steps).every((s) => s === "done")).toBe(true);
  });
});
