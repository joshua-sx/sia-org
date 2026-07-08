import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Lock, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useAssessments, type GoalRating } from "@/hooks/useAssessments";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { RATING_LABELS, RATING_OPTIONS, type StageDraft } from "@/lib/assessmentSchema";
import { windowState, STAGE_LABELS, type Stage } from "@/lib/cycleSchema";
import { stageScore, weightSum, formatScore } from "@/lib/scoring";
import { friendlyError } from "@/lib/siaErrors";

interface Props {
  participant: CycleParticipant;
  cycle: AppraisalCycle;
  /** "manager" = rate + comment (also hr_admin); "reviewer" = reviewer comments only. */
  mode: "manager" | "reviewer";
  /** When set, the header links to the participant's appraisal detail page. */
  detailHref?: string;
}

export function ParticipantAssessmentCard({ participant, cycle, mode, detailHref }: Props) {
  const { data: goals = [], isLoading: goalsLoading } = useGoals(participant.id);
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);
  const {
    data: ratings = [],
    isLoading: ratingsLoading,
    saveDraft,
    submitStage,
    saveReviewerComment,
  } = useAssessments(participant.id, goalIds);

  const submittedFor = (stage: Stage) =>
    stage === "interim" ? participant.interim_submitted_at : participant.final_submitted_at;

  const defaultStage: Stage =
    participant.interim_submitted_at ||
    windowState(cycle.final_window_start, cycle.final_window_end) !== "upcoming"
      ? "final"
      : "interim";

  const loading = goalsLoading || ratingsLoading;

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[hsl(var(--hairline))]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {participant.employee.first_name} {participant.employee.last_name}
          </p>
          <p className="text-xs text-[hsl(var(--ink-subtle))] truncate">
            {participant.employee.job_title || "—"}
            {mode === "reviewer" && (
              <>
                {" "}
                · Manager: {participant.manager.first_name} {participant.manager.last_name} · You're
                the extra reviewer
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <ScoreStat label="Interim" value={participant.interim_score} />
          <ScoreStat label="Final" value={participant.final_score} />
          <ScoreStat label="Overall" value={participant.overall_score} emphasize />
        </div>
        {detailHref && (
          <Link
            to={detailHref}
            className="shrink-0 rounded-md border border-[hsl(var(--hairline))] px-2 py-0.5 text-[11.5px] font-medium text-foreground transition-colors hover:border-[hsl(var(--ink-subtle))]"
          >
            Open →
          </Link>
        )}
      </div>

      {loading ? (
        <p className="px-5 py-4 text-sm text-[hsl(var(--ink-muted))]">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[hsl(var(--ink-muted))]">
          No goals set for this participant yet — assessments unlock once goals exist.
        </p>
      ) : (
        <Tabs defaultValue={defaultStage} className="w-full">
          <div className="px-5 pt-3">
            <TabsList className="h-8">
              {(["interim", "final"] as const).map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs gap-1.5">
                  {submittedFor(s) && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--accent-green))]" />}
                  {STAGE_LABELS[s]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {(["interim", "final"] as const).map((stage) => (
            <TabsContent key={stage} value={stage} className="mt-0">
              <StagePanel
                stage={stage}
                participant={participant}
                cycle={cycle}
                mode={mode}
                goals={goals}
                ratings={ratings}
                onSaveDraft={async (draft) => {
                  try {
                    await saveDraft.mutateAsync({ draft, stage });
                    toast.success("Draft saved");
                  } catch (err) {
                    toast.error(friendlyError(err, "Could not save the draft"));
                  }
                }}
                savingDraft={saveDraft.isPending}
                onSubmit={async () => {
                  try {
                    await submitStage.mutateAsync(stage);
                    toast.success(`${STAGE_LABELS[stage]} submitted`);
                  } catch (err) {
                    toast.error(friendlyError(err, "Could not submit"));
                  }
                }}
                submitting={submitStage.isPending}
                onSaveReviewerComment={async (ratingId, comment) => {
                  try {
                    await saveReviewerComment.mutateAsync({ ratingId, comment });
                    toast.success("Comment saved");
                  } catch (err) {
                    toast.error(friendlyError(err, "Could not save the comment"));
                  }
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function StagePanel({
  stage,
  participant,
  cycle,
  mode,
  goals,
  ratings,
  onSaveDraft,
  savingDraft,
  onSubmit,
  submitting,
  onSaveReviewerComment,
}: {
  stage: Stage;
  participant: CycleParticipant;
  cycle: AppraisalCycle;
  mode: "manager" | "reviewer";
  goals: Array<{ id: string; title: string; weight: number }>;
  ratings: GoalRating[];
  onSaveDraft: (draft: StageDraft) => Promise<void>;
  savingDraft: boolean;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  onSaveReviewerComment: (ratingId: string, comment: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<StageDraft>({});
  const [reviewerDrafts, setReviewerDrafts] = useState<Record<string, string>>({});

  const serverByGoal = useMemo(() => {
    const m = new Map<string, GoalRating>();
    ratings.filter((r) => r.stage === stage).forEach((r) => m.set(r.goal_id, r));
    return m;
  }, [ratings, stage]);

  const rowFor = (goalId: string) =>
    draft[goalId] ?? {
      rating: serverByGoal.get(goalId)?.rating ?? null,
      manager_comment: serverByGoal.get(goalId)?.manager_comment ?? null,
    };

  const submittedAt =
    stage === "interim" ? participant.interim_submitted_at : participant.final_submitted_at;
  const window =
    stage === "interim"
      ? windowState(cycle.interim_window_start, cycle.interim_window_end)
      : windowState(cycle.final_window_start, cycle.final_window_end);

  const editable = mode === "manager" && cycle.status === "active" && !submittedAt && window === "open";
  const reviewerEditable =
    mode === "reviewer" && cycle.status === "active" && !participant.acknowledged_at;

  const merged = goals.map((g) => ({ goal: g, row: rowFor(g.id) }));
  const allRated = merged.every(({ row }) => row.rating !== null);
  const weightsReady = weightSum(goals) === 100;
  const preview = stageScore(
    merged.map(({ goal, row }) => ({ rating: row.rating, weight: goal.weight })),
  );
  const needsInterimFirst = stage === "final" && !participant.interim_submitted_at;
  const canSubmit = editable && allRated && weightsReady && !needsInterimFirst;
  const dirty = Object.keys(draft).length > 0;

  return (
    <div>
      <div className="divide-y divide-[hsl(var(--hairline))] border-t border-[hsl(var(--hairline))] mt-3">
        {merged.map(({ goal, row }) => {
          const server = serverByGoal.get(goal.id);
          return (
            <div key={goal.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-5 min-w-10 items-center justify-center rounded bg-[hsl(var(--ink-strong)/0.05)] px-1.5 text-[10px] font-semibold tabular-nums">
                  {goal.weight}%
                </span>
                <p className="text-sm text-foreground flex-1 min-w-0">{goal.title}</p>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                {editable ? (
                  <Select
                    value={row.rating != null ? String(row.rating) : undefined}
                    onValueChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        [goal.id]: { ...rowFor(goal.id), rating: Number(v) },
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Rate 1–5…" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {RATING_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground tabular-nums self-start pt-1.5">
                    {row.rating != null ? RATING_LABELS[row.rating] : "Not rated"}
                  </p>
                )}

                {editable ? (
                  <Textarea
                    rows={2}
                    placeholder="Manager comment (optional)"
                    value={row.manager_comment ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [goal.id]: { ...rowFor(goal.id), manager_comment: e.target.value },
                      }))
                    }
                  />
                ) : (
                  row.manager_comment && (
                    <p className="text-xs text-[hsl(var(--ink-muted))] leading-relaxed pt-1.5">
                      {row.manager_comment}
                    </p>
                  )
                )}
              </div>

              {mode === "reviewer" ? (
                <div className="mt-3">
                  {server ? (
                    reviewerEditable ? (
                      <div className="flex items-start gap-2">
                        <Textarea
                          rows={2}
                          placeholder="Your reviewer comment…"
                          value={reviewerDrafts[server.id] ?? server.reviewer_comment ?? ""}
                          onChange={(e) =>
                            setReviewerDrafts((prev) => ({ ...prev, [server.id]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewerDrafts[server.id] === undefined}
                          onClick={() => onSaveReviewerComment(server.id, reviewerDrafts[server.id] ?? "")}
                        >
                          <Save className="mr-1 h-3.5 w-3.5" /> Save
                        </Button>
                      </div>
                    ) : (
                      server.reviewer_comment && (
                        <p className="text-xs text-[hsl(var(--ink-muted))]">
                          <span className="font-medium">Your comment:</span> {server.reviewer_comment}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-[11px] text-[hsl(var(--ink-subtle))]">
                      No assessment drafted for this goal yet.
                    </p>
                  )}
                </div>
              ) : (
                server?.reviewer_comment && (
                  <p className="mt-2 text-xs text-[hsl(var(--ink-muted))]">
                    <span className="font-medium">
                      Reviewer{participant.extra_reviewer ? ` (${participant.extra_reviewer.first_name} ${participant.extra_reviewer.last_name})` : ""}:
                    </span>{" "}
                    {server.reviewer_comment}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--ink-strong)/0.02)]">
        <p className="text-xs text-[hsl(var(--ink-muted))] flex-1">
          {submittedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Submitted {new Date(submittedAt).toLocaleDateString()} — score{" "}
              <span className="font-semibold tabular-nums">
                {formatScore(stage === "interim" ? participant.interim_score : participant.final_score)}
              </span>
            </span>
          ) : (
            <>
              Preview score:{" "}
              <span className="font-semibold tabular-nums text-foreground">{formatScore(preview)}</span>
              {!weightsReady && " · goal weights must total 100%"}
              {!allRated && " · rate every goal to submit"}
              {needsInterimFirst && " · submit the interim assessment first"}
              {mode === "manager" && window !== "open" && !submittedAt && (
                <> · window {window === "upcoming" ? "not open yet" : "closed"}</>
              )}
            </>
          )}
        </p>
        {editable && (
          <>
            <Button size="sm" variant="outline" onClick={() => onSaveDraft(draft)} disabled={!dirty || savingDraft}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingDraft ? "Saving…" : "Save draft"}
            </Button>
            <Button size="sm" onClick={onSubmit} disabled={!canSubmit || dirty || submitting}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {submitting ? "Submitting…" : dirty ? "Save draft first" : "Submit"}
            </Button>
          </>
        )}
      </div>
    </div>
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
        className={`tabular-nums font-semibold ${emphasize ? "text-lg text-[hsl(var(--accent-green))]" : "text-sm text-foreground"}`}
      >
        {formatScore(value)}
      </p>
    </div>
  );
}

export default ParticipantAssessmentCard;
