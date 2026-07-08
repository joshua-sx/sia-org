import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AppraisalsTabs } from "@/components/appraisals/AppraisalsTabs";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import CycleFormModal from "@/components/appraisals/CycleFormModal";
import { formatWindow, todayISO, windowState } from "@/lib/cycleSchema";
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
  const { markComplete } = useOnboarding();

  const cycle = cycles.find((c) => c.id === id) ?? null;
  const isHr = profile?.role === "hr_admin";
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <p className="text-sm text-[hsl(var(--ink-muted))]">This cycle doesn't exist.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/appraisals")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to cycles
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <button
        onClick={() => navigate("/appraisals")}
        className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--ink-muted))] hover:text-foreground transition-colors"
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
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
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

      <WindowsSummary cycle={cycle} />

      {cycle.status === "draft" ? (
        isHr ? (
          <DraftLaunchPanel
            cycleId={cycle.id}
            hasActiveCycle={!!activeCycle}
            onLaunch={async (participants) => {
              try {
                await launchCycle.mutateAsync({ cycleId: cycle.id, participants });
                await markComplete("cycle");
                toast.success("Cycle launched");
              } catch (err) {
                toast.error(friendlyError(err, "Launch failed"));
              }
            }}
            launching={launchCycle.isPending}
          />
        ) : (
          <p className="mt-6 text-sm text-[hsl(var(--ink-muted))]">
            This cycle hasn't launched yet.
          </p>
        )
      ) : (
        <ProgressPanel
          cycleId={cycle.id}
          acknowledgementDue={cycle.acknowledgement_due}
          status={cycle.status}
          isHr={isHr}
          onComplete={async () => {
            try {
              await completeCycle.mutateAsync(cycle.id);
              toast.success("Cycle completed");
            } catch (err) {
              toast.error(friendlyError(err, "Could not complete the cycle"));
            }
          }}
          completing={completeCycle.isPending}
        />
      )}

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

function WindowsSummary({
  cycle,
}: {
  cycle: {
    goal_window_start: string;
    goal_window_end: string;
    interim_window_start: string;
    interim_window_end: string;
    final_window_start: string;
    final_window_end: string;
    acknowledgement_due: string;
  };
}) {
  const windows = [
    { label: "Goal setting", start: cycle.goal_window_start, end: cycle.goal_window_end },
    { label: "Interim assessment", start: cycle.interim_window_start, end: cycle.interim_window_end },
    { label: "Final assessment", start: cycle.final_window_start, end: cycle.final_window_end },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {windows.map((w) => {
        const state = windowState(w.start, w.end);
        return (
          <div
            key={w.label}
            className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4"
          >
            <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">{w.label}</p>
            <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
              {formatWindow(w.start, w.end)}
            </p>
            <p
              className="mt-1 text-[11px] font-medium"
              style={{
                color:
                  state === "open"
                    ? "hsl(var(--accent-green))"
                    : state === "upcoming"
                      ? "hsl(var(--accent-blue))"
                      : "hsl(var(--ink-subtle))",
              }}
            >
              {state === "open" ? "Open now" : state === "upcoming" ? "Upcoming" : "Closed"}
            </p>
          </div>
        );
      })}
      <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4">
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Acknowledgement due</p>
        <p className="mt-1 text-sm font-medium text-foreground tabular-nums">{cycle.acknowledgement_due}</p>
      </div>
    </div>
  );
}

function DraftLaunchPanel({
  cycleId,
  hasActiveCycle,
  onLaunch,
  launching,
}: {
  cycleId: string;
  hasActiveCycle: boolean;
  onLaunch: (participants: Array<{ employee_id: string; manager_id: string }>) => Promise<void>;
  launching: boolean;
}) {
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEmployees();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [managerOverrides, setManagerOverrides] = useState<Record<string, string>>({});

  const candidates = useMemo(
    () => employees.filter((e) => e.employment_status === "active"),
    [employees],
  );

  const managerFor = (e: Employee) => managerOverrides[e.id] ?? e.manager_id ?? null;
  const included = candidates.filter((e) => !excluded.has(e.id));
  const unmanaged = included.filter((e) => !managerFor(e));
  const canLaunch = !hasActiveCycle && included.length > 0 && unmanaged.length === 0;

  const toggleExcluded = (employeeId: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[hsl(var(--hairline))]">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Participants</h2>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))]">
            <span className="tabular-nums">{included.length}</span> of{" "}
            <span className="tabular-nums">{candidates.length}</span> active employees included
            {excluded.size > 0 && <> · {excluded.size} excluded</>}
          </p>
        </div>
        <Button
          onClick={() =>
            onLaunch(
              included.map((e) => ({
                employee_id: e.id,
                manager_id: managerFor(e) as string,
              })),
            )
          }
          disabled={!canLaunch || launching}
        >
          <Rocket className="mr-1.5 h-4 w-4" />
          {launching ? "Launching…" : "Launch cycle"}
        </Button>
      </div>

      {hasActiveCycle && (
        <PanelNotice text="Another cycle is already active. Complete it before launching this one." />
      )}
      {!hasActiveCycle && unmanaged.length > 0 && (
        <PanelNotice
          text={`${unmanaged.length} included ${unmanaged.length === 1 ? "employee has" : "employees have"} no manager. Assign one below or exclude them — a cycle can't launch with unmanaged participants.`}
        />
      )}

      {isLoading ? (
        <div className="px-5 py-6">
          <QueryLoading label="Loading employees" rows={4} />
        </div>
      ) : isError ? (
        <div className="px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      ) : candidates.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[hsl(var(--ink-muted))]">
          No active employees to include. Add employees first.
        </p>
      ) : (
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {candidates.map((e) => {
            const isExcluded = excluded.has(e.id);
            const managerId = managerFor(e);
            return (
              <div key={e.id} className={`flex items-center gap-4 px-5 py-3 ${isExcluded ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {e.first_name} {e.last_name}
                  </p>
                  <p className="text-xs text-[hsl(var(--ink-subtle))] truncate">
                    {e.job_title || e.email}
                  </p>
                </div>
                <div className="w-52 shrink-0">
                  <Select
                    value={managerId ?? undefined}
                    onValueChange={(v) => setManagerOverrides((prev) => ({ ...prev, [e.id]: v }))}
                    disabled={isExcluded}
                  >
                    <SelectTrigger
                      className={`h-8 text-xs ${!managerId && !isExcluded ? "border-[hsl(var(--accent-yellow))]" : ""}`}
                    >
                      <SelectValue placeholder="Assign manager…" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates
                        .filter((m) => m.id !== e.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.first_name} {m.last_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-24 shrink-0 items-center justify-end gap-2">
                  <span className="text-[11px] text-[hsl(var(--ink-subtle))]">
                    {isExcluded ? "Excluded" : "Included"}
                  </span>
                  <Switch checked={!isExcluded} onCheckedChange={() => toggleExcluded(e.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PanelNotice({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2.5 px-5 py-3 border-b border-[hsl(var(--hairline))]"
      style={{ backgroundColor: "hsl(var(--accent-yellow) / 0.08)" }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--accent-yellow))" }} />
      <p className="text-xs text-[hsl(var(--ink-muted))] leading-relaxed">{text}</p>
    </div>
  );
}

function ProgressPanel({
  cycleId,
  acknowledgementDue,
  status,
  isHr,
  onComplete,
  completing,
}: {
  cycleId: string;
  acknowledgementDue: string;
  status: "active" | "completed";
  isHr: boolean;
  onComplete: () => Promise<void>;
  completing: boolean;
}) {
  const {
    data: participants = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCycleParticipants(cycleId);

  const participantIds = useMemo(() => participants.map((p) => p.id), [participants]);
  const { data: goalWeights = [] } = useQuery({
    queryKey: ["cycle_goal_progress", cycleId, participantIds.length],
    queryFn: async () => {
      if (participantIds.length === 0) return [] as Array<{ participant_id: string; weight: number }>;
      const { data, error } = await supabase
        .from("goals")
        .select("participant_id, weight")
        .in("participant_id", participantIds);
      if (error) throw error;
      return (data ?? []) as Array<{ participant_id: string; weight: number }>;
    },
    enabled: participantIds.length > 0,
  });

  const weightByParticipant = useMemo(() => {
    const m = new Map<string, number>();
    goalWeights.forEach((g) => m.set(g.participant_id, (m.get(g.participant_id) ?? 0) + g.weight));
    return m;
  }, [goalWeights]);

  // Terminated participants are shown frozen and excluded from denominators.
  const active = participants.filter((p) => p.employee.employment_status !== "terminated");
  const frozen = participants.length - active.length;

  const goalsReady = active.filter((p) => weightByParticipant.get(p.id) === 100).length;
  const interimDone = active.filter((p) => !!p.interim_submitted_at).length;
  const finalDone = active.filter((p) => !!p.final_submitted_at).length;
  const acknowledged = active.filter((p) => !!p.acknowledged_at).length;

  const allAcknowledged = active.length > 0 && acknowledged === active.length;
  const duePassed = todayISO() > acknowledgementDue;
  const canComplete = status === "active" && (duePassed || allAcknowledged);

  const stages = [
    { label: "Goals set (100%)", count: goalsReady },
    { label: "Interim submitted", count: interimDone },
    { label: "Final submitted", count: finalDone },
    { label: "Acknowledged", count: acknowledged },
  ];

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[hsl(var(--hairline))]">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cycle progress</h2>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))]">
            <span className="tabular-nums">{active.length}</span> participants
            {frozen > 0 && <> · {frozen} frozen (terminated)</>}
          </p>
        </div>
        {isHr && status === "active" && (
          <Button onClick={onComplete} disabled={!canComplete || completing} variant="outline">
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {completing ? "Completing…" : "Complete cycle"}
          </Button>
        )}
      </div>
      {isHr && status === "active" && !canComplete && (
        <PanelNotice text="Completing unlocks once the acknowledgement due date has passed or every participant has acknowledged." />
      )}
      {isLoading ? (
        <div className="px-5 py-6">
          <QueryLoading label="Loading cycle progress" rows={4} />
        </div>
      ) : isError ? (
        <div className="px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      ) : (
        <div className="grid gap-px sm:grid-cols-4 bg-[hsl(var(--hairline))]">
          {stages.map((s) => (
            <div key={s.label} className="bg-[hsl(var(--surface-raised))] px-5 py-4">
              <p className="text-2xl font-semibold tabular-nums text-foreground leading-none">
                {s.count}
                <span className="text-sm font-normal text-[hsl(var(--ink-subtle))]">/{active.length}</span>
              </p>
              <p className="mt-1.5 text-[11px] text-[hsl(var(--ink-subtle))] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppraisalCycleDetail;
