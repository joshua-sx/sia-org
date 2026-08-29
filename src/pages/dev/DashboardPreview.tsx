import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronsUpDown,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { WorkspacePage } from "@/components/WorkspacePage";
import EmployeeTable from "@/components/employees/EmployeeTable";
import OrgTree from "@/components/org/OrgTree";
import { AppraisalCycleList } from "@/components/appraisals/AppraisalCycleList";
import {
  OperationalBriefing,
  type OperationalBriefingPreviewData,
} from "@/components/dashboard/OperationalBriefing";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { AuditEvent } from "@/hooks/useCycleAudit";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";
import type { OrgUnitTreeNode } from "@/hooks/useOrgUnits";

const cycle: AppraisalCycle = {
  id: "preview-cycle",
  organization_id: "preview-org",
  name: "2026 Annual Review",
  status: "active",
  goal_window_start: "2026-07-08",
  goal_window_end: "2026-07-18",
  interim_window_start: "2026-07-30",
  interim_window_end: "2026-08-01",
  final_window_start: "2026-10-21",
  final_window_end: "2026-11-28",
  acknowledgement_due: "2026-11-28",
  created_at: "2026-07-01T12:00:00Z",
  updated_at: "2026-08-29T14:42:00Z",
  closed_at: null,
  closed_by: null,
  close_note: null,
  interim_weight_pct: 50,
  final_weight_pct: 50,
};

const employeeNames = [
  ["Ada", "Lovelace", "Senior Engineer"],
  ["James", "Laurent", "Product Designer"],
  ["Maria", "Francis", "People Partner"],
  ["Samuel", "Lee", "Finance Manager"],
  ["Ravi", "Patel", "Engineering Manager"],
  ["Priya", "Shah", "UX Researcher"],
  ["Noah", "Kim", "Frontend Engineer"],
  ["Maya", "Rodriguez", "Marketing Lead"],
] as const;

const employees: Employee[] = employeeNames.map(([firstName, lastName, title], index) => ({
  id: `employee-${index + 1}`,
  organization_id: "preview-org",
  employee_code: `ST-${String(index + 1).padStart(3, "0")}`,
  first_name: firstName,
  last_name: lastName,
  email: `${firstName}.${lastName}@example.com`.toLowerCase(),
  job_title: title,
  org_unit_id: index < 4 ? "product" : "operations",
  manager_id: index < 2 ? null : "employee-5",
  employment_type: "full_time",
  employment_status: "active",
  start_date: null,
  end_date: null,
  location: "Philipsburg",
  phone: null,
  notes: null,
  profile_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-08-29T00:00:00Z",
}));

const participants: CycleParticipant[] = employees.slice(2).map((employee, index) => ({
  id: `participant-${index + 1}`,
  cycle_id: cycle.id,
  employee_id: employee.id,
  manager_id: "employee-5",
  extra_reviewer_id: null,
  interim_submitted_at: null,
  final_submitted_at: null,
  interim_score: null,
  final_score: null,
  overall_score: null,
  acknowledged_at: null,
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-08-29T00:00:00Z",
  employee: {
    id: employee.id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    job_title: employee.job_title,
    employment_status: employee.employment_status,
  },
  manager: {
    id: "employee-5",
    first_name: "Ravi",
    last_name: "Patel",
    job_title: "Engineering Manager",
    employment_status: "active",
  },
  extra_reviewer: null,
}));

function event(
  id: string,
  action: string,
  summary: string,
  createdAt: string,
): AuditEvent {
  return {
    id,
    organization_id: "preview-org",
    actor_profile_id: "preview-user",
    actor_email: "joshua@example.com",
    actor_role: "hr_admin",
    action,
    entity_type: action.split(".")[0],
    entity_id: cycle.id,
    cycle_id: cycle.id,
    employee_id: null,
    summary,
    metadata: {},
    created_at: createdAt,
  };
}

const previewData: OperationalBriefingPreviewData = {
  cycles: [cycle],
  employees,
  participants,
  events: [
    event("event-1", "cycle.dates_changed", "2026 Annual Review dates updated", new Date(Date.now() - 18 * 60_000).toISOString()),
    event("event-2", "participant.manager_changed", "Maria Francis assigned to James Laurent", new Date(Date.now() - 60 * 60_000).toISOString()),
    event("event-3", "participant.added", "Product Design added to the review scope", new Date(Date.now() - 2 * 60 * 60_000).toISOString()),
    event("event-4", "cycle.launched", "Interim assessment phase started", new Date(Date.now() - 20 * 60 * 60_000).toISOString()),
    event("event-5", "assessment.interim_submitted", "Four employees submitted their self-review", new Date(Date.now() - 25 * 60 * 60_000).toISOString()),
  ],
};

const previewCycles: AppraisalCycle[] = [
  cycle,
  {
    ...cycle,
    id: "preview-cycle-2",
    name: "Mid-year check-in",
    status: "draft",
    goal_window_start: "2027-01-08",
    goal_window_end: "2027-01-22",
    interim_window_start: "2027-03-01",
    interim_window_end: "2027-03-12",
    final_window_start: "2027-05-10",
    final_window_end: "2027-05-28",
    acknowledgement_due: "2027-06-04",
  },
];

const unitBase = {
  organization_id: "preview-org",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-08-29T00:00:00Z",
};

const previewOrgTree: OrgUnitTreeNode[] = [
  {
    ...unitBase,
    id: "stello",
    parent_id: null,
    unit_type_id: "company",
    name: "Stello Studio",
    depth: 0,
    typeName: "Company",
    typeLevel: 0,
    children: [
      {
        ...unitBase,
        id: "product",
        parent_id: "stello",
        unit_type_id: "department",
        name: "Product & Design",
        depth: 1,
        typeName: "Department",
        typeLevel: 1,
        children: [
          {
            ...unitBase,
            id: "product-design",
            parent_id: "product",
            unit_type_id: "team",
            name: "Product Design",
            depth: 2,
            typeName: "Team",
            typeLevel: 2,
            children: [],
          },
          {
            ...unitBase,
            id: "engineering",
            parent_id: "product",
            unit_type_id: "team",
            name: "Engineering",
            depth: 2,
            typeName: "Team",
            typeLevel: 2,
            children: [],
          },
        ],
      },
      {
        ...unitBase,
        id: "operations",
        parent_id: "stello",
        unit_type_id: "department",
        name: "Operations",
        depth: 1,
        typeName: "Department",
        typeLevel: 1,
        children: [],
      },
    ],
  },
];

function findUnit(nodes: OrgUnitTreeNode[], id: string | null): OrgUnitTreeNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findUnit(node.children, id);
    if (child) return child;
  }
  return null;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, iconClass: "text-accent-blue", activeClass: "bg-accent-blue/10" },
  { label: "Organization", icon: Building2, iconClass: "text-accent-red", activeClass: "bg-accent-red/[0.08]" },
  { label: "People", icon: Users, iconClass: "text-accent-purple", activeClass: "bg-accent-purple/[0.09]" },
  { label: "Appraisals", icon: CalendarClock, iconClass: "text-accent-green", activeClass: "bg-accent-green/[0.09]" },
] as const;

type PreviewView = (typeof navItems)[number]["label"];

export default function DashboardPreview() {
  const [activeView, setActiveView] = useState<PreviewView>("Dashboard");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>("product");
  const isRtlPreview = new URLSearchParams(window.location.search).get("dir") === "rtl";
  const selectedUnit = useMemo(
    () => findUnit(previewOrgTree, selectedUnitId),
    [selectedUnitId],
  );

  return (
    <div dir={isRtlPreview ? "rtl" : "ltr"} className="flex min-h-screen w-full bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col border-e border-hairline bg-sidebar px-4 py-5 md:flex">
        <BrandMark size="sm" />
        <p className="mt-2 text-xs text-ink-muted">Stello Studio</p>
        <nav className="mt-7 space-y-1" aria-label="Preview navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.label;
            return (
            <button
              key={item.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveView(item.label)}
              className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors duration-150 ${isActive ? `${item.activeClass} font-medium text-foreground` : "text-ink-muted hover:bg-ink-strong/[0.04] hover:text-foreground"}`}
            >
              <item.icon className={`h-4 w-4 ${item.iconClass}`} strokeWidth={isActive ? 2 : 1.75} />
              {item.label}
            </button>
            );
          })}
        </nav>
        <button type="button" className="mt-auto flex items-center gap-3 rounded-lg p-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/10 text-[11px] font-medium text-accent-blue">JB</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Joshua Bowers</span>
            <span className="block text-[11px] text-ink-subtle">HR Administrator</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
        </button>
      </aside>
      <div className="min-w-0 flex-1 overflow-hidden">
        <header className="flex h-14 items-center border-b border-hairline px-5">
          <PanelLeft className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
          <div className="ms-auto flex items-center gap-5 text-xs text-ink-muted">
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-green" />Live</span>
          </div>
        </header>
        <main className="min-w-0 overflow-auto">
          {activeView === "Dashboard" && <OperationalBriefing previewData={previewData} />}

          {activeView === "People" && (
            <WorkspacePage>
              <PageHeader
                title="People"
                subtitle="Manage employee details, reporting lines, and organizational placement from one directory."
                actions={
                  <>
                    <Button variant="outline"><Upload className="h-4 w-4" strokeWidth={1.75} /> Import</Button>
                    <Button><Plus className="h-4 w-4" strokeWidth={2} /> Add person</Button>
                  </>
                }
              />
              <div className="mt-8">
                <EmployeeTable employees={employees} onEdit={() => {}} onDelete={() => {}} />
              </div>
            </WorkspacePage>
          )}

          {activeView === "Organization" && (
            <WorkspacePage>
              <PageHeader
                title="Organization"
                subtitle="Shape the reporting structure that connects your people, managers, and appraisal cycles."
                actions={
                  <>
                    <Button variant="outline"><Upload className="h-4 w-4" strokeWidth={1.75} /> Import CSV</Button>
                    <Button><Plus className="h-4 w-4" strokeWidth={2} /> Add unit</Button>
                  </>
                }
              />
              <div className="mt-8 grid gap-6 min-[1180px]:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl bg-surface-raised p-4 shadow-[var(--shadow-border)]" aria-label="Organization hierarchy">
                  <OrgTree nodes={previewOrgTree} selectedId={selectedUnitId} onSelect={(node) => setSelectedUnitId(node.id)} />
                </section>
                <aside className="self-start rounded-2xl bg-surface-raised p-6 shadow-[var(--shadow-border)] min-[1180px]:sticky min-[1180px]:top-20">
                  {selectedUnit ? (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">{selectedUnit.typeName}</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.35px] text-foreground">{selectedUnit.name}</h2>
                      <div className="mt-6 space-y-5">
                        <div>
                          <p className="text-xs text-ink-subtle">Status</p>
                          <p className="mt-1 text-sm font-medium text-foreground">Active</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-subtle">Child units</p>
                          <p className="mt-1 text-sm font-medium text-foreground tabular-nums">{selectedUnit.children.length}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-8 w-full">Add child unit</Button>
                    </>
                  ) : null}
                </aside>
              </div>
            </WorkspacePage>
          )}

          {activeView === "Appraisals" && (
            <WorkspacePage>
              <PageHeader
                title="Appraisals"
                subtitle="Plan review cycles, monitor progress, and move every appraisal toward a clear next action."
                actions={<Button><Plus className="h-4 w-4" strokeWidth={2} /> New cycle</Button>}
              />
              <div className="mt-8">
                <AppraisalCycleList cycles={previewCycles} />
              </div>
            </WorkspacePage>
          )}
        </main>
      </div>
    </div>
  );
}
