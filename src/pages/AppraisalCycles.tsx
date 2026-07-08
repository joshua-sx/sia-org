import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles, type AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { useEmployees } from "@/hooks/useEmployees";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import CycleFormModal from "@/components/appraisals/CycleFormModal";
import { formatWindow } from "@/lib/cycleSchema";
import { QueryError, QueryLoading } from "@/components/QueryState";

const AppraisalCycles = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: cycles = [], isLoading, isError, error, refetch } = useAppraisalCycles();
  const { data: employees = [] } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);

  const isHr = profile?.role === "hr_admin";
  const hasEmployees = employees.length > 0;
  const newCycleBtn = (
    <Button
      onClick={() => setFormOpen(true)}
      className="shrink-0"
      disabled={!hasEmployees}
    >
      <Plus className="mr-1.5 h-4 w-4" /> New cycle
    </Button>
  );

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-yellow))] uppercase tracking-wider">
            <CalendarClock className="h-3.5 w-3.5" />
            Appraisals
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            Appraisal cycles
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            {isHr
              ? "Create a cycle, review the timeline, and launch when your participant list is ready."
              : "Cycles your organization is running. Your goals and reviews live in the tabs above once a cycle is active."}
          </p>
        </div>
        {isHr && (
          <Button onClick={() => setFormOpen(true)} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" /> New cycle
          </Button>
        )}
      </div>

      <AppraisalsTabs />

      <div className="mt-6">
        {isLoading ? (
          <QueryLoading label="Loading appraisal cycles" />
        ) : isError ? (
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : cycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-6 py-14 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-[hsl(var(--accent-yellow))]" />
            <h2 className="mt-4 text-base font-semibold text-foreground">No appraisal cycles yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[hsl(var(--ink-muted))]">
              {isHr
                ? "Create your first cycle to define the goal-setting, assessment, and acknowledgement windows."
                : "Your HR team hasn't created a cycle yet. Check back soon."}
            </p>
            {isHr && (
              <Button className="mt-5" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create first cycle
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] divide-y divide-[hsl(var(--hairline))] overflow-hidden">
            {cycles.map((cycle: AppraisalCycle) => (
              <Link
                key={cycle.id}
                to={`/appraisals/${cycle.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[hsl(var(--ink-strong)/0.03)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{cycle.name}</span>
                    <CycleStatusBadge status={cycle.status} />
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--ink-muted))]">
                    Goals {formatWindow(cycle.goal_window_start, cycle.goal_window_end)} · Interim{" "}
                    {formatWindow(cycle.interim_window_start, cycle.interim_window_end)} · Final{" "}
                    {formatWindow(cycle.final_window_start, cycle.final_window_end)} · Acknowledge by{" "}
                    {cycle.acknowledgement_due}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--ink-subtle))]" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <CycleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={(cycle) => navigate(`/appraisals/${cycle.id}`)}
      />
    </div>
  );
};

export default AppraisalCycles;
