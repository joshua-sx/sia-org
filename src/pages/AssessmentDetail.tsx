import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useGoals } from "@/hooks/useGoals";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import ParticipantAssessmentCard from "@/components/appraisals/ParticipantAssessmentCard";
import { ProgressTracker } from "@/components/appraisals/ProgressTracker";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { participantTrackerSteps } from "@/lib/trackerSteps";
import { weightSum } from "@/lib/scoring";

const AssessmentDetail = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const { profile } = useAuth();
  const {
    activeCycle,
    isLoading: cyclesLoading,
    isError: cyclesError,
    error: cyclesErr,
    refetch: refetchCycles,
  } = useAppraisalCycles();
  const {
    data: participants = [],
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
    refetch: refetchParticipants,
  } = useCycleParticipants(activeCycle?.id);
  const { myEmployee, isLoading: employeeLoading } = useMyEmployee();

  const participant = participants.find((p) => p.id === participantId) ?? null;
  const { data: goals = [], isLoading: goalsLoading } = useGoals(participant?.id);

  const isHr = profile?.role === "hr_admin";
  const mode: "manager" | "reviewer" =
    isHr || (myEmployee && participant?.manager_id === myEmployee.id) ? "manager" : "reviewer";
  const canView =
    !!participant &&
    (isHr ||
      (!!myEmployee &&
        (participant.manager_id === myEmployee.id || participant.extra_reviewer_id === myEmployee.id)));

  const loading =
    cyclesLoading || employeeLoading || (!!activeCycle && participantsLoading) || (!!participant && goalsLoading);
  const loadError = cyclesError || (!!activeCycle && participantsError);
  const loadErrorMessage =
    (cyclesErr instanceof Error ? cyclesErr.message : undefined) ??
    (participantsErr instanceof Error ? participantsErr.message : undefined);
  const retryLoad = () => {
    void refetchCycles();
    if (activeCycle) void refetchParticipants();
  };

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <PageHead
        title="Assessment | SIA"
        description="Grade a single employee's appraisal and track its progress."
        path="/appraisals/assessments"
      />
      <Link
        to="/appraisals/assessments"
        className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--ink-muted))] hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All assessments
      </Link>

      <p className="mt-3 mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-yellow-ink))] uppercase tracking-wider">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Appraisals
      </p>
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
        {participant
          ? `${participant.employee.first_name} ${participant.employee.last_name}`
          : "Assessment"}
      </h1>
      <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
        {participant?.employee.job_title || "Single appraisal"}
        {activeCycle && <> · {activeCycle.name}</>}
      </p>

      <AppraisalsTabs />

      <div className="mt-6">
        {loading ? (
          <QueryLoading label="Loading assessment" />
        ) : loadError ? (
          <QueryError message={loadErrorMessage} onRetry={retryLoad} />
        ) : !activeCycle ? (
          <EmptyNote text="There's no active appraisal cycle right now." />
        ) : !canView ? (
          <EmptyNote text="This appraisal doesn't exist or isn't assigned to you." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <ParticipantAssessmentCard participant={participant} cycle={activeCycle} mode={mode} />
            </div>
            <aside>
              <ProgressTracker
                title="This appraisal"
                steps={participantTrackerSteps(participant, weightSum(goals))}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-6 py-12 text-center">
      <p className="mx-auto max-w-md text-sm text-[hsl(var(--ink-muted))]">{text}</p>
    </div>
  );
}

export default AssessmentDetail;
