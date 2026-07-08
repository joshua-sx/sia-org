import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useGoals } from "@/hooks/useGoals";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import ParticipantAssessmentCard from "@/components/appraisals/ParticipantAssessmentCard";
import { ProgressTracker } from "@/components/ProgressTracker";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { getManagerAppraisalSteps } from "@/lib/appraisalProgress";

const ParticipantAssessmentDetail = () => {
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
  const { myEmployee } = useMyEmployee();

  const participant = useMemo(
    () => participants.find((p) => p.id === participantId) ?? null,
    [participants, participantId],
  );

  const { data: goals = [] } = useGoals(participant?.id);

  const isHr = profile?.role === "hr_admin";
  const mode: "manager" | "reviewer" =
    isHr || (myEmployee && participant?.manager_id === myEmployee.id) ? "manager" : "reviewer";

  const loading = cyclesLoading || (!!activeCycle && participantsLoading);
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
      <Link
        to="/appraisals/assessments"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--ink-muted))] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to assessments
      </Link>

      {loading ? (
        <div className="mt-6">
          <QueryLoading label="Loading appraisal" />
        </div>
      ) : loadError ? (
        <div className="mt-6">
          <QueryError message={loadErrorMessage} onRetry={retryLoad} />
        </div>
      ) : !activeCycle || !participant ? (
        <div className="mt-6 rounded-xl border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-6 py-12 text-center">
          <p className="mx-auto max-w-md text-sm text-[hsl(var(--ink-muted))]">
            This appraisal isn't available. It may have been closed or you may not have access.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            {participant.employee.first_name} {participant.employee.last_name}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            {participant.employee.job_title || "—"} · {activeCycle.name}
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="min-w-0">
              <ParticipantAssessmentCard participant={participant} cycle={activeCycle} mode={mode} />
            </div>
            <aside className="lg:sticky lg:top-6">
              <ProgressTracker
                title="This appraisal"
                steps={getManagerAppraisalSteps({ participant, cycle: activeCycle, goals })}
                defaultOpen
              />
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default ParticipantAssessmentDetail;
