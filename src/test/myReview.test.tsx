import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyReview from "@/pages/MyReview";

vi.mock("@/hooks/useAppraisalCycles", () => ({
  useAppraisalCycles: () => ({
    activeCycle: { id: "c1", status: "active", acknowledgement_due: "2999-04-01" },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMyEmployee", () => ({
  useMyEmployee: () => ({
    myEmployee: { id: "e1" },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

let participantOverrides: Partial<{ overall_score: number | null; final_submitted_at: string | null; acknowledged_at: string | null }> = {};
const mockAcknowledge = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/hooks/useCycleParticipants", () => ({
  useCycleParticipants: () => ({
    data: [
      {
        id: "p1",
        employee_id: "e1",
        interim_score: 4,
        final_score: 4,
        overall_score: null,
        final_submitted_at: "2026-01-05",
        acknowledged_at: null,
        ...participantOverrides,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    acknowledge: mockAcknowledge,
  }),
}));

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({
    data: [{ id: "g1", title: "Ship the thing", weight: 100 }],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAssessments", () => ({
  useAssessments: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderMyReview() {
  return render(
    <MemoryRouter>
      <MyReview />
    </MemoryRouter>,
  );
}

describe("MyReview acknowledgement button", () => {
  it("stays disabled before the overall score is computed", () => {
    participantOverrides = { overall_score: null };
    renderMyReview();
    expect(screen.getByRole("button", { name: "Acknowledge review" })).toBeDisabled();
  });

  it("enables once the overall score is present", () => {
    participantOverrides = { overall_score: 4.2 };
    renderMyReview();
    expect(screen.getByRole("button", { name: "Acknowledge review" })).toBeEnabled();
  });
});
