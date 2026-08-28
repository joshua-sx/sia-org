import { useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useGoals } from "@/hooks/useGoals";
import { useAssessments } from "@/hooks/useAssessments";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useMergedQueryState } from "@/hooks/useMergedQueryState";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { ProgressTracker } from "@/components/appraisals/ProgressTracker";
import { ScoreStat } from "@/components/appraisals/ScoreStat";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { participantTrackerSteps } from "@/lib/trackerSteps";
import { weightSum } from "@/lib/scoring";
import { RATING_LABELS } from "@/lib/assessmentSchema";
import { STAGE_LABELS, canAcknowledge, type Stage } from "@/lib/cycleSchema";
import { friendlyError } from "@/lib/siaErrors";

const MyReview = () => {
  const {
    activeCycle,
    isLoading: cycleLoading,
    isError: cycleError,
    error: cycleErr,
    refetch: refetchCycles,
  } = useAppraisalCycles();
  const {
    myEmployee,
    isLoading: employeeLoading,
    isError: employeeError,
    error: employeeErr,
    refetch: refetchEmployee,
  } = useMyEmployee();
  const {
    data: participants = [],
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
    refetch: refetchParticipants,
  } = useCycleParticipants(activeCycle?.id);

  const myParticipant = myEmployee
    ? participants.find((p) => p.employee_id === myEmployee.id) ?? null
    : null;

  const {
    data: goals = [],
    isLoading: goalsLoading,
    isError: goalsError,
    error: goalsErr,
    refetch: refetchGoals,
  } = useGoals(myParticipant?.id);
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);
  const {
    data: ratings = [],
    isLoading: ratingsLoading,
    isError: ratingsError,
    error: ratingsErr,
    refetch: refetchRatings,
  } = useAssessments(myParticipant?.id, goalIds);
  const { acknowledge: acknowledgeMutation } = useCycleParticipants(activeCycle?.id);

  const {
    isLoading: loading,
    isError: loadError,
    errorMessage: loadErrorMessage,
    retryAll: retryLoad,
  } = useMergedQueryState([
    {
      isLoading: cycleLoading,
      isError: cycleError,
      error: cycleErr,
      refetch: refetchCycles,
    },
    {
      isLoading: employeeLoading,
      isError: employeeError,
      error: employeeErr,
      refetch: refetchEmployee,
    },
    {
      enabled: !!activeCycle,
      isLoading: participantsLoading,
      isError: participantsError,
      error: participantsErr,
      refetch: refetchParticipants,
    },
    {
      enabled: !!myParticipant,
      isLoading: goalsLoading,
      isError: goalsError,
      error: goalsErr,
      refetch: refetchGoals,
    },
    {
      enabled: !!myParticipant && goalIds.length > 0,
      isLoading: ratingsLoading,
      isError: ratingsError,
      error: ratingsErr,
      refetch: refetchRatings,
    },
  ]);

  const finalRevealed = !!myParticipant?.final_submitted_at;

  const ratingsByStageAndGoal = useMemo(() => {
    const m = new Map<string, (typeof ratings)[number]>();
    ratings.forEach((r) => m.set(`${r.goal_id}:${r.stage}`, r));
    return m;
  }, [ratings]);

  const acknowledgeAllowed = !!myParticipant && canAcknowledge(myParticipant);

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
        My review
      </h1>
      <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
        Your goals are visible throughout the cycle. Ratings and comments appear once your
        manager submits the final assessment.
      </p>

      <AppraisalsTabs />

      <div className="mt-6">
        {loading ? (
          <QueryLoading label="Loading your review" />
        ) : loadError ? (
          <QueryError message={loadErrorMessage} onRetry={retryLoad} />
        ) : !activeCycle ? (
          <EmptyNote text="There's no active appraisal cycle right now." />
        ) : !myEmployee ? (
          <EmptyNote text="Your login isn't linked to an employee record yet. Ask your HR admin to link your profile." />
        ) : !myParticipant ? (
          <EmptyNote text="You're not a participant in the current cycle." />
        ) : goals.length === 0 ? (
          <EmptyNote text="Your manager hasn't set your goals for this cycle yet." />
        ) : (
          <div className="space-y-6">
            <ProgressTracker
              title="Your appraisal"
              steps={participantTrackerSteps(myParticipant, weightSum(goals), {
                acknowledgeAction: { label: "Acknowledge", href: "#acknowledge" },
              })}
            />

            {finalRevealed && (
              <div
                id="acknowledge"
                className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-6">
                    <ScoreStat label="Interim" value={myParticipant.interim_score} />
                    <ScoreStat label="Final" value={myParticipant.final_score} />
                    <ScoreStat label="Overall" value={myParticipant.overall_score} emphasize />
                  </div>
                  {myParticipant.acknowledged_at ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--accent-green))]">
                      <CheckCircle2 className="h-4 w-4" /> Acknowledged{" "}
                      {new Date(myParticipant.acknowledged_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!acknowledgeAllowed || acknowledgeMutation.isPending}
                      onClick={async () => {
                        try {
                          await acknowledgeMutation.mutateAsync(myParticipant.id);
                          toast.success("Review acknowledged");
                        } catch (err) {
                          toast.error(friendlyError(err, "Could not acknowledge"));
                        }
                      }}
                    >
                      {acknowledgeMutation.isPending ? "Saving…" : "Acknowledge review"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] overflow-hidden">
              <div className="px-5 py-4 border-b border-[hsl(var(--hairline))]">
                <h2 className="text-sm font-semibold text-foreground">Goals</h2>
              </div>
              <div className="divide-y divide-[hsl(var(--hairline))]">
                {goals.map((g) => (
                  <div key={g.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-10 items-center justify-center rounded bg-[hsl(var(--ink-strong)/0.05)] px-1.5 text-[10px] font-semibold tabular-nums">
                        {g.weight}%
                      </span>
                      <p className="text-sm text-foreground flex-1">{g.title}</p>
                    </div>
                    {g.description && (
                      <p className="mt-1 text-xs text-[hsl(var(--ink-muted))] leading-relaxed">
                        {g.description}
                      </p>
                    )}

                    {finalRevealed ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {(["interim", "final"] as Stage[]).map((stage) => {
                          const r = ratingsByStageAndGoal.get(`${g.id}:${stage}`);
                          return (
                            <div
                              key={stage}
                              className="rounded-lg border border-[hsl(var(--hairline))] p-3"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
                                {STAGE_LABELS[stage]}
                              </p>
                              <p className="mt-1 text-sm text-foreground">
                                {r?.rating != null ? RATING_LABELS[r.rating] : "Not rated"}
                              </p>
                              {r?.manager_comment && (
                                <p className="mt-1.5 text-xs text-[hsl(var(--ink-muted))] leading-relaxed">
                                  <span className="font-medium">Manager:</span> {r.manager_comment}
                                </p>
                              )}
                              {r?.reviewer_comment && (
                                <p className="mt-1.5 text-xs text-[hsl(var(--ink-muted))] leading-relaxed">
                                  <span className="font-medium">Reviewer:</span> {r.reviewer_comment}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[hsl(var(--ink-subtle))]">
                        <Lock className="h-3 w-3" /> Ratings appear after the final assessment is
                        submitted.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
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

export default MyReview;
