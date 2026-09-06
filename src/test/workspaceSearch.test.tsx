import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { WorkspaceSearch } from "@/components/navigation/WorkspaceSearch";
import { getWorkspaceNavigationGroups } from "@/lib/workspaceNavigation";

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderSearch(onNavigate = vi.fn()) {
  const groups = getWorkspaceNavigationGroups("hr_admin");
  render(
    <MemoryRouter
      initialEntries={["/dashboard"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <WorkspaceSearch groups={groups} collapsed={false} onNavigate={onNavigate} />
      <CurrentPath />
    </MemoryRouter>,
  );
  return onNavigate;
}

describe("WorkspaceSearch", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("opens from the visible search control and navigates to an authorized destination", () => {
    const onNavigate = renderSearch();

    fireEvent.click(screen.getByRole("button", { name: "Search ⌘ K" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search Sia" })).toHaveFocus();

    fireEvent.click(screen.getByText("People"));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/org/employees");
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("opens with the platform command shortcut", () => {
    renderSearch();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
