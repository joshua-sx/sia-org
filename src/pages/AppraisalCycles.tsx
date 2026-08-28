import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles, type AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingStepFrame } from "@/components/onboarding/OnboardingStepFrame";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import CycleFormModal from "@/components/appraisals/CycleFormModal";
import { OrgScoringSettingsCard } from "@/components/appraisals/OrgScoringSettingsCard";
import { formatDate, formatWindow } from "@/lib/cycleSchema";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { playSetupCompleteCue } from "@/lib/completionSounds";
import { friendlyError } from "@/lib/siaErrors";

const AppraisalCycles = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: cycles = [], isLoading, isError, error, refetch } = useAppraisalCycles();
  const { data: employees = [] } = useEmployees();
  const { isOnboarding, steps, markComplete, finishSetup } = useOnboarding();
  const [formOpen, setFormOpen] = useState(false);

  const isHr = profile?.role === "hr_admin";
  const hasEmployees = employees.length > 0;
  const cycleDone = steps.find((s) => s.key === "cycle")?.done ?? false;
  const hasLaunchedCycle = cycles.some((c) => c.status !== "draft");
  const cycleReady = cycleDone || hasLaunchedCycle;

  useStepReadiness(
    "cycle",
    cycleReady,
    cycleReady
      ? "Ready to continue."
      : cycles.length > 0
        ? "Launch your cycle to continue."
        : "Create and launch a cycle to continue."
  );

  const showOnboardingChrome = isOnboarding && isHr;
  const newCycleBtn = (
    <Button
      onClick={() => setFormOpen(true)}
      className="shrink-0"
      disabled={!hasEmployees}
    >
      <Plus className="mr-1.5 h-4 w-4" /> New cycle
    </Button>
  );

  const pageInner = (
    <>
      {!showOnboardingChrome && (
        <PageHeader
          title="Appraisal cycles"
          subtitle={
            isHr
              ? "Create a cycle, review the timeline, and launch when your participant list is ready."
              : "Cycles your organization is running. Your goals and reviews live in the tabs above once a cycle is active."
          }
          actions={
            isHr &&
            (hasEmployees ? newCycleBtn : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="shrink-0">{newCycleBtn}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Add employees before creating a cycle.{" "}
                    <Link to="/org/employees" className="underline">Go to Employees</Link>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          }
        />
      )}

      {showOnboardingChrome && isHr && (
        <div className="mb-6 flex justify-end">
          {hasEmployees ? newCycleBtn : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="shrink-0">{newCycleBtn}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Add employees before creating a cycle.{" "}
                  <Link to="/org/employees" className="underline">Go to Employees</Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {!showOnboardingChrome && <AppraisalsTabs />}

      {isHr && <OrgScoringSettingsCard />}

      <div className={showOnboardingChrome ? "mt-2" : "mt-6"}>
        {isLoading ? (
          <QueryLoading label="Loading appraisal cycles" />
        ) : isError ? (
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : cycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-raised px-6 py-14 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-accent-green" />
            <h2 className="mt-4 text-base font-semibold text-foreground text-balance">No appraisal cycles yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted text-pretty">
              {isHr
                ? "Create your first cycle to define the goal-setting, assessment, and acknowledgement windows."
                : "Your HR team hasn't created a cycle yet. Check back soon."}
            </p>
            {isHr && (
              <Button className="mt-5" onClick={() => setFormOpen(true)} disabled={!hasEmployees}>
                <Plus className="mr-1.5 h-4 w-4" /> Create first cycle
              </Button>
            )}
            {isHr && !hasEmployees && (
              <p className="mt-3 text-xs text-ink-muted">
                You need at least one employee first.{" "}
                <Link to="/org/employees" className="underline">Add employees</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-hairline bg-surface-raised divide-y divide-hairline overflow-hidden">
            {cycles.map((cycle: AppraisalCycle) => (
              <Link
                key={cycle.id}
                to={`/appraisals/${cycle.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-strong/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{cycle.name}</span>
                    <CycleStatusBadge status={cycle.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Goals {formatWindow(cycle.goal_window_start, cycle.goal_window_end)} · Interim{" "}
                    {formatWindow(cycle.interim_window_start, cycle.interim_window_end)} · Final{" "}
                    {formatWindow(cycle.final_window_start, cycle.final_window_end)} · Acknowledge by{" "}
                    {formatDate(cycle.acknowledgement_due)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" />
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
    </>
  );

  return showOnboardingChrome ? (
    <OnboardingStepFrame
      stepKey="cycle"
      title="Create your first cycle"
      subtitle="Set the review timeline. Nothing is sent until you launch it."
      primaryLabel="Finish setup"
      primaryDisabled={cycles.length === 0}
      disabledReason="Create a cycle to finish setup."
      onPrimary={async () => {
        try {
          await markComplete("cycle");
          playSetupCompleteCue();
          await finishSetup();
        } catch (err) {
          toast.error(friendlyError(err, "Could not finish setup"));
        }
      }}
    >
      {pageInner}
    </OnboardingStepFrame>
  ) : (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">{pageInner}</div>
  );
};

export default AppraisalCycles;
