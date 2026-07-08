import { describe, it, expect } from "vitest";
import {
  cycleTrackerSteps,
  participantTrackerSteps,
  sequentialize,
} from "@/lib/trackerSteps";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";

function participant(overrides: Partial<CycleParticipant> = {}): CycleParticipant {
  return {
    id: "p1",
    cycle_id: "c1",
    employee_id: "e1",
    manager_id: "m1",
    extra_reviewer_id: null,
    interim_submitted_at: null,
    final_submitted_at: null,
    interim_score: null,
    final_score: null,
    overall_score: null,
    acknowledged_at: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    employee: {
      id: "e1",
      first_name: "Ada",
      last_name: "Lovelace",
      job_title: null,
      employment_status: "active",
    },
    manager: {
      id: "m1",
      first_name: "Grace",
      last_name: "Hopper",
      job_title: null,
      employment_status: "active",
    },
    extra_reviewer: null,
    ...overrides,
  };
}

describe("sequentialize", () => {
  it("marks the first not-done item active and everything after pending", () => {
    const steps = sequentialize([
      { id: "a", label: "A", done: true },
      { id: "b", label: "B", done: false },
      { id: "c", label: "C", done: true }, // data says done, but sequence wins
      { id: "d", label: "D", done: false },
    ]);
    expect(steps.map((s) => s.status)).toEqual(["done", "active", "pending", "pending"]);
  });

  it("marks everything done when all items are done", () => {
    const steps = sequentialize([
      { id: "a", label: "A", done: true },
      { id: "b", label: "B", done: true },
    ]);
    expect(steps.every((s) => s.status === "done")).toBe(true);
  });

  it("keeps sub and action only on the active row", () => {
    const action = { label: "Go", href: "/go" };
    const steps = sequentialize([
      { id: "a", label: "A", done: true, sub: "done sub", action },
      { id: "b", label: "B", done: false, sub: "active sub", action },
      { id: "c", label: "C", done: false, sub: "pending sub", action },
    ]);
    expect(steps[0].sub).toBeUndefined();
    expect(steps[0].action).toBeUndefined();
    expect(steps[1].sub).toBe("active sub");
    expect(steps[1].action).toEqual(action);
    expect(steps[2].sub).toBeUndefined();
    expect(steps[2].action).toBeUndefined();
  });

  it("handles an empty list", () => {
    expect(sequentialize([])).toEqual([]);
  });
});

describe("cycleTrackerSteps", () => {
  const weights = (id: string, total: number) => [{ participant_id: id, weight: total }];

  it("derives phase completion from participant data with counts in sub", () => {
    const p1 = participant({ id: "p1", interim_submitted_at: "2026-02-01" });
    const p2 = participant({
      id: "p2",
      employee_id: "e2",
      employee: { ...participant().employee, id: "e2" },
    });
    const steps = cycleTrackerSteps({ status: "active" }, [p1, p2], [
      ...weights("p1", 100),
      ...weights("p2", 100),
    ]);
    expect(steps.map((s) => s.status)).toEqual(["done", "done", "active", "pending", "pending"]);
    expect(steps[2].sub).toBe("1/2 submitted");
  });

  it("excludes terminated participants from denominators", () => {
    const activeP = participant({ id: "p1", interim_submitted_at: "2026-02-01" });
    const terminated = participant({
      id: "p2",
      employee: { ...participant().employee, id: "e2", employment_status: "terminated" },
    });
    const steps = cycleTrackerSteps({ status: "active" }, [activeP, terminated], weights("p1", 100));
    // Only p1 counts: goals done (1/1), interim done (1/1) → final is active.
    expect(steps.find((s) => s.id === "final")?.status).toBe("active");
    expect(steps.find((s) => s.id === "final")?.sub).toBe("0/1 submitted");
  });

  it("forces every phase done on a completed cycle (audit view)", () => {
    const steps = cycleTrackerSteps({ status: "completed" }, [participant()], []);
    expect(steps.every((s) => s.status === "done")).toBe(true);
  });

  it("keeps goal assignment active while weights are incomplete", () => {
    const steps = cycleTrackerSteps({ status: "active" }, [participant()], weights("p1", 60));
    const goals = steps.find((s) => s.id === "goals");
    expect(goals?.status).toBe("active");
    expect(goals?.sub).toBe("0/1 goals set");
    expect(goals?.action?.href).toBe("/appraisals/goals");
  });
});

describe("participantTrackerSteps", () => {
  it("walks the sequence off real submission timestamps", () => {
    const steps = participantTrackerSteps(
      participant({ interim_submitted_at: "2026-02-01" }),
      100,
    );
    expect(steps.map((s) => s.status)).toEqual(["done", "done", "active", "pending"]);
  });

  it("keeps goals active until weights total 100", () => {
    const steps = participantTrackerSteps(participant(), 40);
    expect(steps[0].status).toBe("active");
    expect(steps[0].sub).toBe("40% of 100% weighted");
  });

  it("attaches the acknowledge action only when acknowledgement is allowed", () => {
    const action = { label: "Acknowledge", href: "#acknowledge" };
    const notReady = participantTrackerSteps(
      participant({ interim_submitted_at: "2026-02-01", final_submitted_at: "2026-03-01" }),
      100,
      { acknowledgeAction: action },
    );
    // Final submitted but no overall score yet → canAcknowledge is false.
    expect(notReady.find((s) => s.id === "acknowledgement")?.action).toBeUndefined();

    const ready = participantTrackerSteps(
      participant({
        interim_submitted_at: "2026-02-01",
        final_submitted_at: "2026-03-01",
        overall_score: 3.5,
      }),
      100,
      { acknowledgeAction: action },
    );
    const ack = ready.find((s) => s.id === "acknowledgement");
    expect(ack?.status).toBe("active");
    expect(ack?.action).toEqual(action);
  });

  it("completes fully once acknowledged", () => {
    const steps = participantTrackerSteps(
      participant({
        interim_submitted_at: "2026-02-01",
        final_submitted_at: "2026-03-01",
        overall_score: 3.5,
        acknowledged_at: "2026-03-10",
      }),
      100,
    );
    expect(steps.every((s) => s.status === "done")).toBe(true);
  });
});
