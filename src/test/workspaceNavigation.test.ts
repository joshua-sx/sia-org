import { describe, expect, it } from "vitest";
import { getWorkspaceNavigationGroups } from "@/lib/workspaceNavigation";

const titlesFor = (role: "hr_admin" | "manager" | "employee") =>
  getWorkspaceNavigationGroups(role).flatMap((group) => group.items.map((item) => item.title));

describe("workspace navigation", () => {
  it("keeps organization management in the HR workspace", () => {
    expect(titlesFor("hr_admin")).toEqual([
      "Overview",
      "Organization",
      "People",
      "Review cycles",
    ]);
  });

  it("gives managers team work and a separate personal review", () => {
    expect(titlesFor("manager")).toEqual([
      "Overview",
      "Team goals",
      "Assigned reviews",
      "My review",
    ]);
  });

  it("keeps employee navigation focused while preserving reviewer discoverability", () => {
    expect(titlesFor("employee")).toEqual(["Overview", "Assigned reviews", "My review"]);
  });
});
