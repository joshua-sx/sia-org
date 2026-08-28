import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useCycleGoalWeights } from "@/hooks/useCycleGoalWeights";
import { useEmployees } from "@/hooks/useEmployees";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOnboardingContext, useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import CycleFormModal from "@/components/appraisals/CycleFormModal";
import { ProgressTracker } from "@/components/appraisals/ProgressTracker";
import { CycleReportsPanel } from "@/components/appraisals/CycleReportsPanel";
import { CycleWindowsSummary } from "@/components/appraisals/CycleWindowsSummary";
import { DraftLaunchPanel } from "@/components/appraisals/DraftLaunchPanel";
import { CycleCompletionPanel } from "@/components/appraisals/CycleCompletionPanel";
import { CycleActivityLog } from "@/components/appraisals/CycleActivityLog";
import { cycleTrackerSteps } from "@/lib/trackerSteps";
import { friendlyError } from "@/lib/siaErrors";
import { QueryError, QueryLoading } from "@/components/QueryState";

const AppraisalCycleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    data: cycles = [],
    isLoading,
    isError,
    error,
    refetch,
    activeCycle,
    launchCycle,
    completeCycle,
    deleteCycle,
  } = useAppraisalCycles();
  const { markComplete, isOnboarding, steps } = useOnboarding();
  const { data: employees = [] } = useEmployees();
  const { data: units = [] } = useOrgUnits();
  const { setFooterSuppressed } = useOnboardingContext();

  const cycle = cycles.find((c) => c.id === id) ?? null;
  const isHr = profile?.role === "hr_admin";
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [justLaunched, setJustLaunched] = useState(false);

  // Own the onboarding chrome explicitly for the post-launch success beat,
  // rather than relying on isOnboarding flipping false in the same render
  // (mirrors SetupWizard's use of the same mechanism).
  useEffect(() => {
    if (!justLaunched) return;
    setFooterSuppressed(true);
    return () => setFooterSuppressed(false);
  }, [justLaunched, setFooterSuppressed]);

  const isLaunched = !!cycle && cycle.status !== "draft";
  const cycleStepDone = steps.find((s) => s.key === "cycle")?.done ?? false;

  useStepReadiness(
    "cycle",
    cycleStepDone || isLaunched,
    isLaunched ? "Ready to continue." : "Launch your cycle to continue."
  );
  const { data: participants = [], isLoading: participantsLoading } = useCycleParticipants(
    isLaunched ? cycle.id : undefined,
  );
  const participantIds = useMemo(() => participants.map((p) => p.id), [participants]);
  const { data: goalWeights = [] } = useCycleGoalWeights(cycle?.id ?? "", participantIds);

  if (isLoading) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <QueryLoading label="Loading appraisal cycle" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <QueryError
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <p className="text-sm text-ink-muted">This cycle doesn't exist.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/appraisals")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to cycles
        </Button>
      </div>
    );
  }

  if (justLaunched) {
    return (
      <StepSuccess
        eyebrow="Setup complete"
        title="Welcome to SIA"
        description={`"${cycle.name}" is live. Your workspace is ready to run its first appraisal cycle.`}
        primaryLabel="Go to dashboard"
        onPrimary={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <button
        onClick={() => navigate("/appraisals")}
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All cycles
      </button>

      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
              {cycle.name}
            </h1>
            <CycleStatusBadge status={cycle.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {cycle.status === "draft"
              ? "Review the timeline and participant list, then launch."
              : cycle.status === "active"
                ? "The cycle is running. Progress updates as managers and employees complete each stage."
                : "This cycle is completed."}
          </p>
        </div>
        {isHr && cycle.status === "draft" && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit dates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      <AppraisalsTabs />

      {isLaunched && !participantsLoading && (
        <div className="mt-6">
          <ProgressTracker
            title="Cycle progress"
            steps={cycleTrackerSteps(cycle, participants, goalWeights)}
            defaultOpen
          />
        </div>
      )}

      {isHr && isLaunched && !participantsLoading && (
        <CycleReportsPanel
          cycle={cycle}
          participants={participants}
          goalWeights={goalWeights}
          employees={employees}
          units={units}
        />
      )}

      <CycleWindowsSummary cycle={cycle} />

      {cycle.status === "draft" ? (
        isHr ? (
          <DraftLaunchPanel
            cycleId={cycle.id}
            hasActiveCycle={!!activeCycle}
            onLaunch={async (launchParticipants) => {
              try {
                await launchCycle.mutateAsync({ cycleId: cycle.id, participants: launchParticipants });
                await markComplete("cycle");
                if (isOnboarding) {
                  setJustLaunched(true);
                } else {
                  toast.success("Cycle launched");
                }
              } catch (err) {
                toast.error(friendlyError(err, "Launch failed"));
              }
            }}
            launching={launchCycle.isPending}
          />
        ) : (
          <p className="mt-6 text-sm text-ink-muted">
            This cycle hasn't launched yet.
          </p>
        )
      ) : (
        <CycleCompletionPanel
          cycleId={cycle.id}
          status={cycle.status}
          closedAt={cycle.closed_at}
          closeNote={cycle.close_note}
          isHr={isHr}
          onComplete={async ({ force, note }) => {
            try {
              await completeCycle.mutateAsync({ cycleId: cycle.id, force, note });
              toast.success("Cycle closed and locked");
            } catch (err) {
              toast.error(friendlyError(err, "Could not close the cycle"));
            }
          }}
          completing={completeCycle.isPending}
        />
      )}

      {isHr && isLaunched && <CycleActivityLog cycleId={cycle.id} cycleName={cycle.name} />}

      <CycleFormModal open={editOpen} onOpenChange={setEditOpen} editing={cycle} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cycle?</AlertDialogTitle>
            <AlertDialogDescription>
              "{cycle.name}" will be permanently removed. This is only possible while the
              cycle hasn't launched yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteCycle.mutateAsync(cycle.id);
                  toast.success("Cycle deleted");
                  navigate("/appraisals");
                } catch (err) {
                  toast.error(friendlyError(err, "Delete failed"));
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppraisalCycleDetail;
