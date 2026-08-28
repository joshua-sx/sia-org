import { describe, expect, it } from "vitest";
import type {
  CycleParticipant,
  ParticipantPerson,
} from "@/hooks/useCycleParticipants";
import {
  activeCycleParticipants,
  participantGoalWeightMap,
} from "@/lib/cycleParticipantData";

function participant(
  id: string,
  employmentStatus: ParticipantPerson["employment_status"],
): CycleParticipant {
  return {
    id,
    cycle_id: "cycle-1",
    employee_id: `employee-${id}`,
    manager_id: "manager-1",
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
      id: `employee-${id}`,
      first_name: "Employee",
      last_name: id,
      job_title: null,
      employment_status: employmentStatus,
    },
    manager: {
      id: "manager-1",
      first_name: "Manager",
      last_name: "One",
      job_title: null,
      employment_status: "active",
    },
    extra_reviewer: null,
  };
}

describe("activeCycleParticipants", () => {
  it("excludes only terminated participants", () => {
    const active = participant("active", "active");
    const onLeave = participant("leave", "on_leave");
    const terminated = participant("terminated", "terminated");

    expect(
      activeCycleParticipants([active, onLeave, terminated]).map(({ id }) => id),
    ).toEqual(["active", "leave"]);
  });
});

describe("participantGoalWeightMap", () => {
  it("sums multiple goal weights by participant", () => {
    const weights = participantGoalWeightMap([
      { participant_id: "participant-1", weight: 40 },
      { participant_id: "participant-2", weight: 100 },
      { participant_id: "participant-1", weight: 60 },
    ]);

    expect([...weights.entries()]).toEqual([
      ["participant-1", 100],
      ["participant-2", 100],
    ]);
  });

  it("returns an empty map when there are no goals", () => {
    expect(participantGoalWeightMap([])).toEqual(new Map());
  });
});
