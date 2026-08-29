import {
  Bell,
  Building2,
  CalendarClock,
  ChevronsUpDown,
  LayoutDashboard,
  PanelLeft,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import {
  OperationalBriefing,
  type OperationalBriefingPreviewData,
} from "@/components/dashboard/OperationalBriefing";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { AuditEvent } from "@/hooks/useCycleAudit";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";

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

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, color: "--accent-blue" },
  { label: "Organization", icon: Building2, color: "--accent-red" },
  { label: "People", icon: Users, color: "--accent-purple" },
  { label: "Appraisals", icon: CalendarClock, color: "--accent-green" },
];

export default function DashboardPreview() {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-sidebar px-4 py-5 md:flex">
        <BrandMark size="sm" />
        <p className="mt-2 text-xs text-ink-muted">Stello Studio</p>
        <nav className="mt-7 space-y-1" aria-label="Preview navigation">
          {navItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${index === 0 ? "bg-accent-blue/10 font-medium text-foreground" : "text-ink-muted"}`}
            >
              <item.icon className="h-4 w-4" style={{ color: `hsl(var(${item.color}))` }} />
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="mt-auto flex items-center gap-3 rounded-lg p-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/10 text-[11px] font-medium text-accent-blue">JB</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Joshua Bowers</span>
            <span className="block text-[11px] text-ink-subtle">HR Administrator</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-ink-subtle" />
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center border-b border-hairline px-5">
          <PanelLeft className="h-4 w-4 text-ink-subtle" />
          <div className="ml-auto flex items-center gap-5 text-xs text-ink-muted">
            <Bell className="h-4 w-4" />
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-green" />Live</span>
          </div>
        </header>
        <OperationalBriefing previewData={previewData} />
      </div>
    </div>
  );
}
