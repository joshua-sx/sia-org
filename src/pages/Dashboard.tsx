import { Link } from "react-router-dom";
import { Download, Plus, Users, CalendarClock, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { SetupDashboard } from "@/pages/SetupDashboard";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useEmployees } from "@/hooks/useEmployees";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompletionChart } from "@/components/dashboard/CompletionChart";
import { PendingActionsCard } from "@/components/dashboard/PendingActionsCard";
import { ActiveCyclesTable } from "@/components/dashboard/ActiveCyclesTable";

const ROLE_LABEL: Record<string, string> = {
  hr_admin: "HR Admin",
  manager: "Manager",
  employee: "Employee",
};

const Dashboard = () => {
  const { profile, organization } = useAuth();
  const { setupComplete } = useOnboarding();

  if (!setupComplete) {
    return <SetupDashboard />;
  }

  const isHr = profile?.role === "hr_admin";
  const firstName = profile?.full_name?.split(" ")[0];
  const roleLabel = profile?.role ? ROLE_LABEL[profile.role] ?? profile.role : "";

  const { data: cycles = [], activeCycle } = useAppraisalCycles();
  const { data: employees = [] } = useEmployees();
  const { data: activeParticipants = [] } = useCycleParticipants(activeCycle?.id);

  const activeCycles = cycles.filter((c) => c.status === "active").length;
  const inProgress = activeParticipants.filter(
    (p) => !p.acknowledged_at,
  ).length;
  const completed = activeParticipants.filter((p) => !!p.acknowledged_at).length;

  const extras: Record<string, { participants: number; submitted: number; ownerName?: string | null }> = {};
  extras[activeCycle?.id ?? ""] = {
    participants: activeParticipants.length,
    submitted: activeParticipants.reduce(
      (acc, p) =>
        acc +
        (p.interim_submitted_at ? 1 : 0) +
        (p.final_submitted_at ? 1 : 0) +
        (p.acknowledged_at ? 1 : 0),
      0,
    ),
    ownerName: profile?.full_name,
  };
  // fill others with zeros so table renders
  for (const c of cycles) if (!extras[c.id]) extras[c.id] = { participants: 0, submitted: 0, ownerName: profile?.full_name };

  const lastUpdated = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto w-full">
      {/* Header band */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            Welcome{firstName ? `, ${firstName}` : ""} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            {organization?.name}
            {roleLabel && <> · <span className="text-[hsl(var(--ink-subtle))]">{roleLabel}</span></>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))] tabular-nums">
            Last updated · {lastUpdated}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 active:scale-[0.96]"
              style={{ transitionProperty: "background-color, transform", transitionDuration: "150ms" }}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Link to="/appraisals">
              <Button
                size="sm"
                className="rounded-full gap-1.5 bg-[hsl(var(--accent-blue))] text-white hover:bg-[hsl(var(--accent-blue)/0.9)] active:scale-[0.96]"
                style={{ transitionProperty: "background-color, transform", transitionDuration: "150ms" }}
              >
                <Plus className="h-3.5 w-3.5" />
                {cycles.length === 0 ? "Create cycle" : "New cycle"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active cycles" value={activeCycles} icon={CalendarClock} accent="green" />
        <StatCard label="Employees" value={employees.length} icon={Users} accent="purple" />
        <StatCard
          label="Assessments in progress"
          value={inProgress}
          icon={ClipboardCheck}
          accent="blue"
        />
        <StatCard
          label="Completed reviews"
          value={completed}
          icon={CheckCircle2}
          accent="green"
        />
      </div>

      {/* Two-column band */}
      <div className="mt-4 grid lg:grid-cols-[1fr_360px] gap-4">
        <PendingActionsCard
          isHr={isHr}
          activeCycle={activeCycle}
          participants={activeParticipants}
        />
        <CompletionChart participants={activeParticipants} />
      </div>

      {/* Cycles table */}
      <div className="mt-4">
        <ActiveCyclesTable cycles={cycles} extras={extras} />
      </div>
    </div>
  );
};

export default Dashboard;
