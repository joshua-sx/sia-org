import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { Employee } from "@/hooks/useEmployees";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import type { RoleNavigationGroup, RoleNavigationItem } from "@/lib/workspaceNavigation";

export type WorkspaceSearchKind = "page" | "person" | "team" | "cycle";

export interface WorkspaceSearchEntry {
  id: string;
  kind: WorkspaceSearchKind;
  title: string;
  subtitle?: string;
  url: string;
  /** Extra terms matched against the query but not displayed. */
  keywords: string;
  icon: RoleNavigationItem["icon"];
  accent: RoleNavigationItem["accent"];
}

export const WORKSPACE_SEARCH_GROUP_LABELS: Record<WorkspaceSearchKind, string> = {
  page: "Pages",
  person: "People",
  team: "Teams",
  cycle: "Review cycles",
};

const KIND_ORDER: WorkspaceSearchKind[] = ["page", "person", "team", "cycle"];

const CYCLE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

export function pageEntries(groups: RoleNavigationGroup[]): WorkspaceSearchEntry[] {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      id: `page:${item.url}`,
      kind: "page" as const,
      title: item.title,
      subtitle: group.label,
      url: item.url,
      keywords: `${item.title} ${group.label}`,
      icon: item.icon,
      accent: item.accent,
    })),
  );
}

export function personEntries(
  employees: Employee[],
  unitName: (unitId: string | null) => string | undefined,
): WorkspaceSearchEntry[] {
  return employees.map((employee) => {
    const name = `${employee.first_name} ${employee.last_name}`.trim();
    const team = unitName(employee.org_unit_id);
    return {
      id: `person:${employee.id}`,
      kind: "person" as const,
      title: name,
      subtitle: [employee.job_title, team].filter(Boolean).join(" · ") || employee.email,
      url: `/org/employees?q=${encodeURIComponent(employee.email || name)}`,
      keywords: [name, employee.email, employee.job_title, team, employee.employment_status]
        .filter(Boolean)
        .join(" "),
      icon: "people" as const,
      accent: "--accent-purple" as const,
    };
  });
}

export function teamEntries(
  units: OrgUnit[],
  typeName: (unitTypeId: string) => string | undefined,
): WorkspaceSearchEntry[] {
  return units.map((unit) => ({
    id: `team:${unit.id}`,
    kind: "team" as const,
    title: unit.name,
    subtitle: typeName(unit.unit_type_id),
    url: `/org/structure?unit=${unit.id}`,
    keywords: `${unit.name} ${typeName(unit.unit_type_id) ?? ""}`,
    icon: "organization" as const,
    accent: "--accent-red" as const,
  }));
}

export function cycleEntries(cycles: AppraisalCycle[]): WorkspaceSearchEntry[] {
  return cycles.map((cycle) => ({
    id: `cycle:${cycle.id}`,
    kind: "cycle" as const,
    title: cycle.name,
    subtitle: CYCLE_STATUS_LABELS[cycle.status] ?? cycle.status,
    url: `/appraisals/${cycle.id}`,
    keywords: `${cycle.name} ${cycle.status}`,
    icon: "cycles" as const,
    accent: "--accent-green" as const,
  }));
}

function score(entry: WorkspaceSearchEntry, needle: string): number {
  const title = entry.title.toLowerCase();
  if (title === needle) return 0;
  if (title.startsWith(needle)) return 1;
  if (title.includes(needle)) return 2;
  if (entry.keywords.toLowerCase().includes(needle)) return 3;
  return -1;
}

/** Filter and rank entries, grouped by kind, with a per-group cap. */
export function searchWorkspace(
  entries: WorkspaceSearchEntry[],
  query: string,
  limitPerKind = 6,
): { kind: WorkspaceSearchKind; label: string; entries: WorkspaceSearchEntry[] }[] {
  const needle = query.trim().toLowerCase();

  const matched = needle
    ? entries
        .map((entry) => ({ entry, rank: score(entry, needle) }))
        .filter((row) => row.rank >= 0)
        .sort((a, b) => a.rank - b.rank || a.entry.title.localeCompare(b.entry.title))
        .map((row) => row.entry)
    : entries.filter((entry) => entry.kind === "page");

  return KIND_ORDER.map((kind) => ({
    kind,
    label: WORKSPACE_SEARCH_GROUP_LABELS[kind],
    entries: matched.filter((entry) => entry.kind === kind).slice(0, limitPerKind),
  })).filter((group) => group.entries.length > 0);
}
