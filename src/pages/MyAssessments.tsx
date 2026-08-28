import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants, type CycleParticipant } from "@/hooks/useCycleParticipants";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useMergedQueryState } from "@/hooks/useMergedQueryState";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import ParticipantAssessmentCard from "@/components/appraisals/ParticipantAssessmentCard";
import { QueryError, QueryLoading } from "@/components/QueryState";

const MyAssessments = () => {
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

  const isHr = profile?.role === "hr_admin";
  const {
    isLoading: loading,
    isError: loadError,
    errorMessage: loadErrorMessage,
    retryAll: retryLoad,
  } = useMergedQueryState([
    {
      isLoading: cyclesLoading,
      isError: cyclesError,
      error: cyclesErr,
      refetch: refetchCycles,
    },
    {
      enabled: !!activeCycle,
      isLoading: participantsLoading,
      isError: participantsError,
      error: participantsErr,
      refetch: refetchParticipants,
    },
  ]);

  // Two lanes: reports I manage (or all, for hr_admin) get the manager lane;
  // participants where I'm the extra reviewer get the reviewer lane. RLS
  // already scopes `participants` to rows I'm allowed to see in some role.
  const managerLane = useMemo(() => {
    if (isHr) return participants;
    if (!myEmployee) return [];
    return participants.filter((p) => p.manager_id === myEmployee.id);
  }, [participants, isHr, myEmployee]);

  const reviewerLane = useMemo(() => {
    if (!myEmployee) return [];
    return participants.filter(
      (p) => p.extra_reviewer_id === myEmployee.id && p.manager_id !== myEmployee.id,
    );
  }, [participants, myEmployee]);

  const groupByManager = (rows: CycleParticipant[]) => {
    const byManager = new Map<string, { label: string; rows: CycleParticipant[] }>();
    rows.forEach((p) => {
      const key = p.manager_id;
      const label = `${p.manager.first_name} ${p.manager.last_name}`;
      if (!byManager.has(key)) byManager.set(key, { label, rows: [] });
      byManager.get(key)!.rows.push(p);
    });
    return [...byManager.values()].sort((a, b) => a.label.localeCompare(b.label));
  };

  const managerGroups = useMemo(() => groupByManager(managerLane), [managerLane]);

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
        Assessments
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Rate each goal and add comments during the interim and final windows. Submitting locks
        that stage and computes the score.
      </p>

      <AppraisalsTabs />

      <div className="mt-6 space-y-8">
        {loading ? (
          <QueryLoading label="Loading assessments" />
        ) : loadError ? (
          <QueryError message={loadErrorMessage} onRetry={retryLoad} />
        ) : !activeCycle ? (
          <EmptyNote text="There's no active appraisal cycle right now." />
        ) : (
          <>
            {managerLane.length > 0 && (
              <section className="space-y-4">
                {isHr && <h2 className="text-sm font-semibold text-foreground">As manager / HR</h2>}
                <div className="space-y-6">
                  {managerGroups.map((group) => (
                    <div key={group.label} className="space-y-3">
                      {isHr && managerGroups.length > 1 && (
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                          Manager · {group.label}
                        </h3>
                      )}
                      {group.rows.map((p) => (
                        <ParticipantAssessmentCard
                          key={p.id}
                          participant={p}
                          cycle={activeCycle}
                          mode="manager"
                          detailHref={`/appraisals/assessments/${p.id}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reviewerLane.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">As extra reviewer</h2>
                <div className="space-y-4">
                  {reviewerLane.map((p) => (
                    <ParticipantAssessmentCard
                      key={p.id}
                      participant={p}
                      cycle={activeCycle}
                      mode="reviewer"
                      detailHref={`/appraisals/assessments/${p.id}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {managerLane.length === 0 && reviewerLane.length === 0 && (
              <EmptyNote
                text={
                  !isHr && !myEmployee
                    ? "Your login isn't linked to an employee record yet. Ask your HR admin to link your profile."
                    : "You have no reports or reviewer assignments in this cycle."
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-raised px-6 py-12 text-center">
      <p className="mx-auto max-w-md text-sm text-ink-muted">{text}</p>
    </div>
  );
}

export default MyAssessments;
