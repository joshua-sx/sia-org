import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSidebar } from "@/components/navigation/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { deriveOnboardingSteps } from "@/lib/onboardingSteps";
import { getWorkspaceNavigationGroups } from "@/lib/workspaceNavigation";

const onboardingSteps = deriveOnboardingSteps({
  account: { done: true, skipped: false },
  structure: { done: true, skipped: false },
  people: { done: false, skipped: false },
  cycle: { done: false, skipped: false },
});

describe("WorkspaceSidebar", () => {
  it("replaces normal navigation with an accessible onboarding checklist", () => {
    render(
      <MemoryRouter
        initialEntries={["/org/employees"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SidebarProvider>
          <WorkspaceSidebar
            organizationName="Sia Labs"
            profileName="Jamie Morgan"
            profileEmail="jamie@sialabs.example"
            initials="JM"
            roleLabel="HR Administrator"
            groups={getWorkspaceNavigationGroups("hr_admin")}
            onboarding={{ steps: onboardingSteps, progressCount: 2, totalSteps: 4 }}
            onSignOut={vi.fn()}
          />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Workspace setup" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Workspace setup progress" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(screen.getByRole("link", { name: /People & access In progress/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: /Search/ })).not.toBeInTheDocument();
  });
});
