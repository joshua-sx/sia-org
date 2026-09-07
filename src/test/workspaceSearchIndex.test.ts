import { describe, expect, it } from "vitest";
import {
  cycleEntries,
  pageEntries,
  personEntries,
  searchWorkspace,
  teamEntries,
} from "@/lib/workspaceSearchIndex";
import { getWorkspaceNavigationGroups } from "@/lib/workspaceNavigation";
import type { Employee } from "@/hooks/useEmployees";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";

const employee = {
  id: "emp-1",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@sia.demo",
  job_title: "Engineer",
  org_unit_id: "unit-1",
  employment_status: "active",
} as unknown as Employee;

const unit = { id: "unit-1", name: "Finance", unit_type_id: "type-1" } as unknown as OrgUnit;
const cycle = { id: "cycle-1", name: "H1 2026", status: "draft" } as unknown as AppraisalCycle;

function allEntries() {
  return [
    ...pageEntries(getWorkspaceNavigationGroups("hr_admin")),
    ...personEntries([employee], () => "Finance"),
    ...teamEntries([unit], () => "Division"),
    ...cycleEntries([cycle]),
  ];
}

describe("workspace search index", () => {
  it("shows only pages when the query is empty", () => {
    const groups = searchWorkspace(allEntries(), "");
    expect(groups.map((g) => g.kind)).toEqual(["page"]);
  });

  it("finds a person by name and deep-links to the people page", () => {
    const groups = searchWorkspace(allEntries(), "lovelace");
    const people = groups.find((g) => g.kind === "person");
    expect(people?.entries[0].title).toBe("Ada Lovelace");
    expect(people?.entries[0].url).toBe("/org/employees?q=ada%40sia.demo");
  });

  it("finds a person by email or job title", () => {
    expect(searchWorkspace(allEntries(), "ada@sia.demo")).toHaveLength(1);
    expect(searchWorkspace(allEntries(), "engineer")[0].kind).toBe("person");
  });

  it("finds teams and cycles", () => {
    const teams = searchWorkspace(allEntries(), "finance").find((g) => g.kind === "team");
    expect(teams?.entries[0].url).toBe("/org/structure?unit=unit-1");
    const cycles = searchWorkspace(allEntries(), "h1");
    expect(cycles[0].entries[0].url).toBe("/appraisals/cycle-1");
    expect(cycles[0].entries[0].subtitle).toBe("Draft");
  });

  it("ranks exact and prefix title matches above keyword matches", () => {
    const groups = searchWorkspace(allEntries(), "people");
    expect(groups[0].entries[0].title).toBe("People");
  });
});
