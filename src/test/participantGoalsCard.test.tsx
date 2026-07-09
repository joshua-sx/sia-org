import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipantGoalsCard } from "@/components/appraisals/ParticipantGoalsCard";
import type { Goal } from "@/hooks/useGoals";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";

const mockUseGoals = vi.fn();
vi.mock("@/hooks/useGoals", () => ({
  useGoals: (...args: unknown[]) => mockUseGoals(...args),
}));

vi.mock("@/hooks/useCycleParticipants", () => ({
  useCycleParticipants: () => ({
    setExtraReviewer: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

const participant: CycleParticipant = {
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
  employee: { id: "e1", first_name: "Ada", last_name: "Lovelace", job_title: "Engineer", employment_status: "active" },
  manager: { id: "m1", first_name: "Grace", last_name: "Hopper", job_title: "Manager", employment_status: "active" },
  extra_reviewer: null,
};

function makeGoal(id: string, weight: number): Goal {
  return {
    id,
    participant_id: participant.id,
    title: `Goal ${id}`,
    description: null,
    weight,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

function renderCard(goals: Goal[]) {
  mockUseGoals.mockReturnValue({
    data: goals,
    isLoading: false,
    createGoal: { mutateAsync: vi.fn(), isPending: false },
    updateGoal: { mutateAsync: vi.fn(), isPending: false },
    deleteGoal: { mutateAsync: vi.fn(), isPending: false },
  });
  return render(
    <ParticipantGoalsCard participant={participant} cycleId="c1" canEdit employees={[]} />,
  );
}

describe("ParticipantGoalsCard goal weight validation UI", () => {
  it("flags the set as not ready while weights fall short of 100%", () => {
    renderCard([makeGoal("g1", 40), makeGoal("g2", 20)]);
    expect(screen.getByText(/60\/100%/)).toBeInTheDocument();
    expect(screen.queryByText(/Ready/)).not.toBeInTheDocument();
  });

  it("marks the set ready once weights sum to exactly 100%", () => {
    renderCard([makeGoal("g1", 60), makeGoal("g2", 40)]);
    expect(screen.getByText(/100\/100%/)).toBeInTheDocument();
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
  });
});
