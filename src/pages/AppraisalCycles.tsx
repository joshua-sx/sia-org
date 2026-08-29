import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { WorkspacePage } from "@/components/WorkspacePage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useEmployees } from "@/hooks/useEmployees";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingStepFrame } from "@/components/onboarding/OnboardingStepFrame";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { AppraisalCycleList } from "@/components/appraisals/AppraisalCycleList";
import CycleFormModal from "@/components/appraisals/CycleFormModal";
import { OrgScoringSettingsCard } from "@/components/appraisals/OrgScoringSettingsCard";
import { QueryError, QueryLoading } from "@/components/QueryState";

const AppraisalCycles = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: cycles = [], isLoading, isError, error, refetch } = useAppraisalCycles();
  const { data: employees = [] } = useEmployees();
  const { isOnboarding, steps } = useOnboarding();
  const [formOpen, setFormOpen] = useState(false);

  const isHr = profile?.role === "hr_admin";
  const hasEmployees = employees.length > 0;
  const cycleDone = steps.find((s) => s.key === "cycle")?.done ?? false;
  const hasLaunchedCycle = cycles.some((c) => c.status !== "draft");
  const hasAnyCycle = cycles.length > 0;
  const cycleReady = cycleDone || hasAnyCycle;

  useStepReadiness(
    "cycle",
    cycleReady,
    cycleReady
      ? hasLaunchedCycle
        ? "Ready to finish setup."
        : "Cycle drafted — finish setup, or open it to launch."
      : "Create a cycle to finish setup.",
  );

  const showOnboardingChrome = isOnboarding && isHr;
  const newCycleBtn = (
    <Button
      onClick={() => setFormOpen(true)}
      className="shrink-0"
      disabled={!hasEmployees}
    >
      <Plus className="h-4 w-4" strokeWidth={2} /> New cycle
    </Button>
  );

  const pageInner = (
    <>
      {!showOnboardingChrome && (
        <PageHeader
          title="Appraisals"
          subtitle={
            isHr
              ? "Plan review cycles, monitor progress, and move every appraisal toward a clear next action."
              : "Follow your organization's review cycles, goals, assessments, and final outcomes."
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
          <div className="rounded-2xl border border-dashed border-hairline bg-surface-raised px-6 py-14 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-accent-green" />
            <h2 className="mt-4 text-base font-semibold text-foreground text-balance">No appraisal cycles yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted text-pretty">
              {isHr
                ? "Create your first cycle to define the goal-setting, assessment, and acknowledgement windows."
                : "Your HR team hasn't created a cycle yet. Check back soon."}
            </p>
            {isHr && (
              <Button className="mt-5" onClick={() => setFormOpen(true)} disabled={!hasEmployees}>
                <Plus className="h-4 w-4" strokeWidth={2} /> Create first cycle
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
          <AppraisalCycleList cycles={cycles} />
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
      hideFooter
    >
      {pageInner}
    </OnboardingStepFrame>
  ) : (
    <WorkspacePage>{pageInner}</WorkspacePage>
  );
};

export default AppraisalCycles;
