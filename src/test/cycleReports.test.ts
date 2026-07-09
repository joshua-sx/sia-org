import { describe, expect, it } from "vitest";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import {
  activeParticipants,
  buildCycleCompletionSummary,
  buildManagerReports,
  buildOverdueTasks,
  buildParticipantReports,
  filterParticipantRows,
} from "@/lib/cycleReports";

const windows = {
  goal_window_start: "2026-01-01",
  goal_window_end: "2026-01-31",
  interim_window_start: "2026-02-01",
  interim_window_end: "2026-02-28",
  final_window_start: "2026-03-01",
  final_window_end: "2026-03-31",
  acknowledgement_due: "2026-04-15",
};

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
    created_at: "",
    updated_at: "",
    employee: {
      id: "e1",
      first_name: "Ada",
      last_name: "Lovelace",
      job_title: "Engineer",
      employment_status: "active",
    },
    manager: {
      id: "m1",
      first_name: "Grace",
      last_name: "Hopper",
      job_title: "Manager",
      employment_status: "active",
    },
    extra_reviewer: null,
    ...overrides,
  };
}

describe("buildParticipantReports", () => {
  it("marks goals overdue after the goal window closes", () => {
    const rows = buildParticipantReports(
      [participant()],
      [],
      windows,
      new Map(),
      "2026-02-10",
    );
    expect(rows[0].goals).toBe("overdue");
    expect(rows[0].overdueTasks).toContain("goals");
    expect(rows[0].maxDaysOverdue).toBeGreaterThan(0);
  });

  it("marks acknowledgement overdue when due date passed and final is in", () => {
    const rows = buildParticipantReports(
      [
        participant({
          final_submitted_at: "2026-03-20T00:00:00Z",
          overall_score: 4.2,
        }),
      ],
      [{ participant_id: "p1", weight: 100 }],
      windows,
      new Map(),
      "2026-04-20",
    );
    expect(rows[0].acknowledgement).toBe("overdue");
    expect(rows[0].overdueTasks).toContain("acknowledgement");
  });

  it("excludes terminated participants from active list helper", () => {
    const participants = [
      participant(),
      participant({
        id: "p2",
        employee: {
          id: "e2",
          first_name: "Alan",
          last_name: "Turing",
          job_title: null,
          employment_status: "terminated",
        },
      }),
    ];
    expect(activeParticipants(participants)).toHaveLength(1);
    const rows = buildParticipantReports(participants, [], windows, new Map(), "2026-01-15");
    expect(rows.find((r) => r.participantId === "p2")?.frozen).toBe(true);
  });
});

describe("buildCycleCompletionSummary", () => {
  it("computes completion counts from participant rows", () => {
    const rows = buildParticipantReports(
      [
        participant({
          interim_submitted_at: "2026-02-10",
          final_submitted_at: "2026-03-10",
          acknowledged_at: "2026-04-01",
          overall_score: 4,
        }),
        participant({ id: "p2", employee_id: "e2" }),
      ],
      [
        { participant_id: "p1", weight: 100 },
        { participant_id: "p2", weight: 50 },
      ],
      windows,
      new Map(),
      "2026-02-10",
    );
    const summary = buildCycleCompletionSummary({ name: "FY26" }, rows);
    expect(summary.totalParticipants).toBe(2);
    expect(summary.goalsComplete).toBe(1);
    expect(summary.interimComplete).toBe(1);
    expect(summary.acknowledged).toBe(1);
  });
});

describe("buildManagerReports", () => {
  it("aggregates per-manager completion", () => {
    const rows = buildParticipantReports(
      [
        participant({ interim_submitted_at: "2026-02-01", final_submitted_at: "2026-03-01" }),
        participant({
          id: "p2",
          employee_id: "e2",
          employee: {
            id: "e2",
            first_name: "Linus",
            last_name: "Torvalds",
            job_title: null,
            employment_status: "active",
          },
        }),
      ],
      [
        { participant_id: "p1", weight: 100 },
        { participant_id: "p2", weight: 100 },
      ],
      windows,
      new Map(),
      "2026-03-15",
    );
    const managers = buildManagerReports(rows);
    expect(managers).toHaveLength(1);
    expect(managers[0].assigned).toBe(2);
    expect(managers[0].finalComplete).toBe(1);
  });
});

describe("buildOverdueTasks", () => {
  it("lists manager and employee overdue rows", () => {
    const rows = buildParticipantReports(
      [
        participant(),
        participant({
          id: "p2",
          employee_id: "e2",
          final_submitted_at: "2026-03-20",
          overall_score: 3.5,
          employee: {
            id: "e2",
            first_name: "Linus",
            last_name: "Torvalds",
            job_title: null,
            employment_status: "active",
          },
        }),
      ],
      [],
      windows,
      new Map(),
      "2026-04-20",
    );
    const overdue = buildOverdueTasks(rows, windows);
    expect(overdue.some((t) => t.taskType === "Goals")).toBe(true);
    expect(overdue.some((t) => t.taskType === "Acknowledgement")).toBe(true);
  });
});

describe("filterParticipantRows", () => {
  it("filters overdue participants", () => {
    const rows = buildParticipantReports([participant()], [], windows, new Map(), "2026-03-01");
    expect(filterParticipantRows(rows, "overdue").length).toBeGreaterThan(0);
    expect(filterParticipantRows(rows, "complete")).toHaveLength(0);
  });
});
