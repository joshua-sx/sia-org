import { useMemo } from "react";
import { Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants, type CycleParticipant } from "@/hooks/useCycleParticipants";
import { useEmployees } from "@/hooks/useEmployees";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import ParticipantGoalsCard from "@/components/appraisals/ParticipantGoalsCard";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { windowState, formatWindow } from "@/lib/cycleSchema";

const MyGoals = () => {
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
  const { data: employees = [] } = useEmployees();
  const { myEmployee } = useMyEmployee();

  const isHr = profile?.role === "hr_admin";

  // RLS already scopes rows (managers: own reports; hr: everyone). For hr the
  // list can include their own participation — keep only rows they manage
  // unless they're hr, where a grouped view of all is the point.
  const managed = useMemo(() => {
    if (isHr) return participants;
    if (!myEmployee) return [];
    return participants.filter((p) => p.manager_id === myEmployee.id);
  }, [participants, isHr, myEmployee]);

  const groups = useMemo(() => {
    const byManager = new Map<string, { label: string; rows: CycleParticipant[] }>();
    managed.forEach((p) => {
      const key = p.manager_id;
      const label = `${p.manager.first_name} ${p.manager.last_name}`;
      if (!byManager.has(key)) byManager.set(key, { label, rows: [] });
      byManager.get(key)!.rows.push(p);
    });
    return [...byManager.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [managed]);

  const goalWindow = activeCycle
    ? windowState(activeCycle.goal_window_start, activeCycle.goal_window_end)
    : null;
  const canEdit = !!activeCycle && goalWindow === "open";

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
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-yellow))] uppercase tracking-wider">
        <Target className="h-3.5 w-3.5" />
        Appraisals
      </p>
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
        Team goals
      </h1>
      <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
        {activeCycle
          ? `Set weighted goals for each of your reports during the goal window (${formatWindow(
              activeCycle.goal_window_start,
              activeCycle.goal_window_end,
            )}). Weights must total 100%.`
          : "Goals are set per participant once a cycle is active."}
      </p>

      <AppraisalsTabs />

      <div className="mt-6 space-y-6">
        {loading ? (
          <QueryLoading label="Loading team goals" />
        ) : loadError ? (
          <QueryError message={loadErrorMessage} onRetry={retryLoad} />
        ) : !activeCycle ? (
          <EmptyNote text="There's no active appraisal cycle right now." />
        ) : !isHr && !myEmployee ? (
          <EmptyNote text="Your login isn't linked to an employee record yet, so there are no reports to show. Ask your HR admin to link your profile." />
        ) : managed.length === 0 ? (
          <EmptyNote text="No reports are assigned to you in this cycle." />
        ) : (
          <>
            {goalWindow !== "open" && (
              <p className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--accent-yellow)/0.08)] px-4 py-3 text-xs text-[hsl(var(--ink-muted))]">
                The goal-setting window is {goalWindow === "upcoming" ? "not open yet" : "closed"} —
                goals are read-only.
              </p>
            )}
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                {isHr && groups.length > 1 && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
                    Manager · {group.label}
                  </h2>
                )}
                {group.rows.map((p) => (
                  <ParticipantGoalsCard
                    key={p.id}
                    participant={p}
                    cycleId={activeCycle.id}
                    canEdit={canEdit && !p.interim_submitted_at && !p.final_submitted_at}
                    employees={employees}
                  />
                ))}
              </div>
            ))}
          </>
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

export default MyGoals;
