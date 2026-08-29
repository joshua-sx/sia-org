import { describe, expect, it } from "vitest";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";
import {
  buildBriefingAttention,
  buildBriefingPhases,
  getBriefingDeadline,
  selectBriefingCycle,
} from "@/lib/dashboardBriefing";

const baseCycle: AppraisalCycle = {
  id: "cycle-1",
  organization_id: "org-1",
  name: "2026 Annual Review",
  status: "active",
  goal_window_start: "2026-07-08",
  goal_window_end: "2026-07-18",
  interim_window_start: "2026-07-30",
  interim_window_end: "2026-08-01",
  final_window_start: "2026-10-21",
  final_window_end: "2026-11-28",
  acknowledgement_due: "2026-11-28",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-08-29T00:00:00Z",
  closed_at: null,
  closed_by: null,
  close_note: null,
  interim_weight_pct: 50,
  final_weight_pct: 50,
};

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "employee-1",
    organization_id: "org-1",
    employee_code: null,
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    job_title: "Senior Engineer",
    org_unit_id: "unit-1",
    manager_id: "manager-1",
    employment_type: "full_time",
    employment_status: "active",
    start_date: null,
    end_date: null,
    location: null,
    phone: null,
    notes: null,
    profile_id: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function participant(overrides: Partial<CycleParticipant> = {}): CycleParticipant {
  return {
    id: "participant-1",
    cycle_id: "cycle-1",
    employee_id: "employee-1",
    manager_id: "manager-1",
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
      id: "employee-1",
      first_name: "Ada",
      last_name: "Lovelace",
      job_title: "Senior Engineer",
      employment_status: "active",
    },
    manager: {
      id: "manager-1",
      first_name: "Grace",
      last_name: "Hopper",
      job_title: "Director",
      employment_status: "active",
    },
    extra_reviewer: null,
    ...overrides,
  };
}

describe("selectBriefingCycle", () => {
  it("prefers the active cycle over newer draft work", () => {
    const draft = { ...baseCycle, id: "draft", status: "draft" as const };
    expect(selectBriefingCycle([draft, baseCycle])?.id).toBe("cycle-1");
  });
});

describe("buildBriefingPhases", () => {
  it("keeps the next phase visibly current between review windows", () => {
    const phases = buildBriefingPhases(baseCycle, "2026-08-29");
    expect(phases.map((phase) => phase.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("marks every phase upcoming while the cycle is still a draft", () => {
    const phases = buildBriefingPhases({ ...baseCycle, status: "draft" }, "2026-08-29");
    expect(phases.every((phase) => phase.state === "upcoming")).toBe(true);
  });
});

describe("getBriefingDeadline", () => {
  it("finds the next meaningful deadline", () => {
    expect(getBriefingDeadline(baseCycle, "2026-08-29")).toMatchObject({
      label: "Final assessment ends",
      date: "2026-11-28",
      daysAway: 91,
    });
  });
});

describe("buildBriefingAttention", () => {
  it("surfaces missing manager assignments before launch", () => {
    const draft = { ...baseCycle, status: "draft" as const };
    const items = buildBriefingAttention(
      draft,
      [employee({ manager_id: null }), employee({ id: "employee-2" })],
      [],
      "2026-08-29",
    );
    expect(items[0]).toMatchObject({
      id: "missing-managers",
      count: 1,
      tone: "warning",
    });
  });

  it("uses participant submissions for an active cycle", () => {
    const items = buildBriefingAttention(
      baseCycle,
      [employee()],
      [participant()],
      "2026-08-29",
    );
    expect(items[0]).toMatchObject({
      id: "self-reviews",
      count: 1,
      tone: "warning",
    });
  });

  it("summarizes completed-cycle records without reopening blockers", () => {
    const completed = { ...baseCycle, status: "completed" as const };
    const items = buildBriefingAttention(
      completed,
      [employee()],
      [participant({ final_submitted_at: "2026-11-20", acknowledged_at: "2026-11-29" })],
      "2026-12-01",
    );
    expect(items.map((item) => item.tone)).toEqual(["success", "success", "info"]);
    expect(items[0].count).toBe(1);
    expect(items[1].count).toBe(1);
  });
});
