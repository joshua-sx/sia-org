import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProgressTracker, type TrackerStep } from "@/components/appraisals/ProgressTracker";

const steps: TrackerStep[] = [
  { id: "a", label: "Scaffold", status: "done" },
  { id: "b", label: "Build", status: "done" },
  {
    id: "c",
    label: "Gate",
    status: "active",
    sub: "18/30 submitted",
    action: { label: "Open form", href: "/form" },
  },
  { id: "d", label: "Checkout", status: "pending" },
  { id: "e", label: "Polish", status: "pending" },
];

function renderTracker(props: Partial<Parameters<typeof ProgressTracker>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ProgressTracker title="To-dos" steps={steps} {...props} />
    </MemoryRouter>,
  );
}

describe("ProgressTracker", () => {
  it("derives the counter from the steps", () => {
    renderTracker();
    expect(screen.getByText("2/5")).toBeInTheDocument();
  });

  it("toggles expansion via the header button", () => {
    renderTracker();
    const header = screen.getByRole("button", { name: /to-dos/i });
    expect(header).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("respects defaultOpen", () => {
    renderTracker({ defaultOpen: false });
    expect(screen.getByRole("button", { name: /to-dos/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("marks the active step with aria-current and shows its sub text", () => {
    renderTracker();
    const active = screen.getByText("Gate").closest("li");
    expect(active).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("18/30 submitted")).toBeInTheDocument();
  });

  it("renders the action chip as a link on the active row only", () => {
    renderTracker();
    const chip = screen.getByRole("link", { name: "Open form →" });
    expect(chip).toHaveAttribute("href", "/form");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("has no step-level buttons unless onStepClick is provided (never click-to-complete)", () => {
    renderTracker();
    // Only the collapse toggle is a button.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("invokes onStepClick for navigation when provided", () => {
    const onStepClick = vi.fn();
    renderTracker({ onStepClick });
    fireEvent.click(screen.getByRole("button", { name: "Scaffold" }));
    expect(onStepClick).toHaveBeenCalledWith("a");
  });

  it("shows the complete state when every step is done", () => {
    render(
      <MemoryRouter>
        <ProgressTracker
          title="To-dos"
          steps={steps.map((s) => ({ ...s, status: "done" as const, sub: undefined, action: undefined }))}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("5/5")).toBeInTheDocument();
    // No action chips or subs survive on a complete tracker.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("labels the step list for assistive tech", () => {
    renderTracker();
    expect(screen.getByRole("list", { name: "To-dos steps" })).toBeInTheDocument();
  });
});
