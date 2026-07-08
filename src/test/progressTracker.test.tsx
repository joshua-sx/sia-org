import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProgressTracker, type TrackerStep } from "@/components/ProgressTracker";

function renderTracker(props: Parameters<typeof ProgressTracker>[0]) {
  return render(
    <MemoryRouter>
      <ProgressTracker {...props} />
    </MemoryRouter>,
  );
}

const baseSteps: TrackerStep[] = [
  { id: "a", label: "First step", status: "done" },
  { id: "b", label: "Second step", status: "active", sub: "18/30 submitted" },
  { id: "c", label: "Third step", status: "pending" },
];

describe("ProgressTracker", () => {
  it("renders the title and a derived counter", () => {
    renderTracker({ title: "Cycle progress", steps: baseSteps });
    expect(screen.getByText("Cycle progress")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("is collapsed by default and toggles open when the header is clicked", () => {
    renderTracker({ title: "Cycle progress", steps: baseSteps });
    const header = screen.getByRole("button", { expanded: false });
    fireEvent.click(header);
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("honors defaultOpen", () => {
    renderTracker({ title: "Cycle progress", steps: baseSteps, defaultOpen: true });
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("shows a full counter when every step is done", () => {
    const done: TrackerStep[] = baseSteps.map((s) => ({ ...s, status: "done" }));
    renderTracker({ title: "Cycle progress", steps: done });
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("renders the action chip only on the active step and only when provided", () => {
    const steps: TrackerStep[] = [
      { id: "a", label: "First step", status: "done" },
      {
        id: "b",
        label: "Second step",
        status: "active",
        action: { label: "Open form", href: "/appraisals/my-review" },
      },
      {
        id: "c",
        label: "Third step",
        status: "pending",
        action: { label: "Should not show", href: "/nope" },
      },
    ];
    renderTracker({ title: "Your appraisal", steps, defaultOpen: true });

    const chip = screen.getByRole("link", { name: /open form/i });
    expect(chip).toHaveAttribute("href", "/appraisals/my-review");
    expect(screen.queryByRole("link", { name: /should not show/i })).not.toBeInTheDocument();
  });

  it("fires onStepClick with the step id without mutating steps", () => {
    const onStepClick = vi.fn();
    const steps: TrackerStep[] = baseSteps.map((s) => ({ ...s }));
    const snapshot = JSON.stringify(steps);
    renderTracker({ title: "Cycle progress", steps, defaultOpen: true, onStepClick });

    fireEvent.click(screen.getByText("Second step"));
    expect(onStepClick).toHaveBeenCalledWith("b");
    expect(JSON.stringify(steps)).toBe(snapshot);
  });

  it("does not leak the action link click into the row navigation handler", () => {
    const onStepClick = vi.fn();
    const steps: TrackerStep[] = [
      {
        id: "b",
        label: "Second step",
        status: "active",
        action: { label: "Open form", href: "/x" },
      },
    ];
    renderTracker({ title: "Your appraisal", steps, defaultOpen: true, onStepClick });

    const row = screen.getByText("Second step").closest("li")!;
    fireEvent.click(within(row).getByRole("link", { name: /open form/i }));
    expect(onStepClick).not.toHaveBeenCalled();
  });
});
