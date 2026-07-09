import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipantAssessmentCard } from "@/components/appraisals/ParticipantAssessmentCard";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { GoalRating } from "@/hooks/useAssessments";

const mockUseGoals = vi.fn();
vi.mock("@/hooks/useGoals", () => ({
  useGoals: (...args: unknown[]) => mockUseGoals(...args),
}));

const mockUseAssessments = vi.fn();
vi.mock("@/hooks/useAssessments", () => ({
  useAssessments: (...args: unknown[]) => mockUseAssessments(...args),
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

// Interim window open, final window not yet open, so the default tab is "interim".
const cycle: AppraisalCycle = {
  id: "c1",
  organization_id: "o1",
  name: "FY26 Review",
  status: "active",
  goal_window_start: "2000-01-01",
  goal_window_end: "2000-02-01",
  interim_window_start: "2000-01-01",
  interim_window_end: "2999-01-01",
  final_window_start: "2999-02-01",
  final_window_end: "2999-03-01",
  acknowledgement_due: "2999-04-01",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const goals = [
  { id: "g1", title: "Goal 1", weight: 50 },
  { id: "g2", title: "Goal 2", weight: 50 },
];

function rating(goalId: string, value: number | null): GoalRating {
  return {
    id: `r-${goalId}`,
    goal_id: goalId,
    stage: "interim",
    rating: value,
    manager_comment: null,
    reviewer_comment: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

function renderCard(ratings: GoalRating[]) {
  mockUseGoals.mockReturnValue({ data: goals, isLoading: false });
  mockUseAssessments.mockReturnValue({
    data: ratings,
    isLoading: false,
    saveDraft: { mutateAsync: vi.fn(), isPending: false },
    submitStage: { mutateAsync: vi.fn(), isPending: false },
    saveReviewerComment: { mutateAsync: vi.fn(), isPending: false },
  });
  return render(
    <ParticipantAssessmentCard participant={participant} cycle={cycle} mode="manager" />,
  );
}

describe("ParticipantAssessmentCard assessment form", () => {
  it("keeps Submit disabled while any goal is unrated", () => {
    renderCard([rating("g1", 4)]); // g2 has no rating yet
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("enables Submit once every goal has a rating", () => {
    renderCard([rating("g1", 4), rating("g2", 3)]);
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });
});
