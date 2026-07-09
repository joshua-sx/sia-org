import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { todayISO } from "@/lib/cycleSchema";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { PanelNotice } from "@/components/appraisals/PanelNotice";

export function CycleCompletionPanel({
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

  // Terminated participants are shown frozen and excluded from denominators.
  const active = participants.filter((p) => p.employee.employment_status !== "terminated");
  const frozen = participants.length - active.length;

  const acknowledged = active.filter((p) => !!p.acknowledged_at).length;
  const allAcknowledged = active.length > 0 && acknowledged === active.length;
  const duePassed = todayISO() > acknowledgementDue;
  const canComplete = status === "active" && (duePassed || allAcknowledged);

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Completion</h2>
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
        <div className="border-t border-[hsl(var(--hairline))] [&>div]:border-b-0">
          <PanelNotice text="Completing unlocks once the acknowledgement due date has passed or every participant has acknowledged." />
        </div>
      )}
      {isLoading && (
        <div className="border-t border-[hsl(var(--hairline))] px-5 py-6">
          <QueryLoading label="Loading cycle progress" rows={2} />
        </div>
      )}
      {isError && (
        <div className="border-t border-[hsl(var(--hairline))] px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      )}
    </div>
  );
}
