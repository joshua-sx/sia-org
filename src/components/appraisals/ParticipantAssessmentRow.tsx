import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useGoals } from "@/hooks/useGoals";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { getManagerAppraisalSteps } from "@/lib/appraisalProgress";
import { formatScore } from "@/lib/scoring";

interface Props {
  participant: CycleParticipant;
  cycle: AppraisalCycle;
}

/**
 * Compact, navigable summary of one employee's appraisal for the manager lane.
 * The status string mirrors the ProgressTracker's active step (shared
 * derivation), and it deep-links to the per-employee detail page. Shares the
 * `["goals", participantId]` query cache with the detail page, so opening a row
 * costs no extra request.
 */
export function ParticipantAssessmentRow({ participant, cycle }: Props) {
  const { data: goals = [] } = useGoals(participant.id);
  const steps = getManagerAppraisalSteps({ participant, cycle, goals });
  const active = steps.find((s) => s.status === "active");
  const status = active ? active.label : "Complete";

  return (
    <Link
      to={`/appraisals/assessments/${participant.id}`}
      className="flex items-center gap-3 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-5 py-3.5 transition-colors hover:border-[hsl(var(--ink-subtle))]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {participant.employee.first_name} {participant.employee.last_name}
        </p>
        <p className="truncate text-xs text-[hsl(var(--ink-subtle))]">
          {participant.employee.job_title || "—"} · {status}
        </p>
      </div>
      <div className="hidden items-center gap-4 text-right sm:flex">
        <ScoreStat label="Interim" value={participant.interim_score} />
        <ScoreStat label="Final" value={participant.final_score} />
        <ScoreStat label="Overall" value={participant.overall_score} emphasize />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--ink-subtle))]" />
    </Link>
  );
}

function ScoreStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number | null;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">{label}</p>
      <p
        className={`tabular-nums font-semibold ${emphasize ? "text-base text-[hsl(var(--accent-green))]" : "text-sm text-foreground"}`}
      >
        {formatScore(value)}
      </p>
    </div>
  );
}

export default ParticipantAssessmentRow;
