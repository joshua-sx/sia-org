import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoals, type Goal } from "@/hooks/useGoals";
import { useCycleParticipants, type CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";
import { goalFormSchema, emptyGoalForm, type GoalFormValues } from "@/lib/goalSchema";
import { weightSum } from "@/lib/scoring";
import { friendlyError } from "@/lib/siaErrors";

const NONE = "__none__";

interface Props {
  participant: CycleParticipant;
  cycleId: string;
  /** Goal writes allowed (cycle active + goal window open + nothing submitted). */
  canEdit: boolean;
  /** Candidates for the extra-reviewer picker (org employees). */
  employees: Employee[];
}

export function ParticipantGoalsCard({ participant, cycleId, canEdit, employees }: Props) {
  const { data: goals = [], isLoading, createGoal, updateGoal, deleteGoal } = useGoals(participant.id);
  const { setExtraReviewer } = useCycleParticipants(cycleId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const total = weightSum(goals);
  const ready = total === 100;
  const canPickReviewer = !participant.final_submitted_at;

  const reviewerOptions = employees.filter(
    (e) =>
      e.id !== participant.employee_id &&
      e.id !== participant.manager_id &&
      e.employment_status === "active",
  );

  const handleDelete = async (goal: Goal) => {
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast.success("Goal removed");
    } catch (err) {
      toast.error(friendlyError(err, "Could not remove the goal"));
    }
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[hsl(var(--hairline))]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {participant.employee.first_name} {participant.employee.last_name}
          </p>
          <p className="text-xs text-[hsl(var(--ink-subtle))] truncate">
            {participant.employee.job_title || "—"} · Manager: {participant.manager.first_name}{" "}
            {participant.manager.last_name}
          </p>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tabular-nums"
          style={{
            backgroundColor: ready ? "hsl(var(--accent-green) / 0.12)" : "hsl(var(--accent-yellow) / 0.14)",
            color: ready ? "hsl(var(--accent-green))" : "hsl(45,70%,32%)",
          }}
        >
          {total}/100% {ready ? "· Ready" : ""}
        </span>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add goal
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="px-5 py-4 text-sm text-[hsl(var(--ink-muted))]">Loading goals…</p>
      ) : goals.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[hsl(var(--ink-muted))]">
          No goals yet.{canEdit ? " Add goals until weights total 100%." : ""}
        </p>
      ) : (
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {goals.map((g) => (
            <div key={g.id} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-0.5 inline-flex h-6 min-w-11 items-center justify-center rounded-md bg-[hsl(var(--ink-strong)/0.05)] px-1.5 text-[11px] font-semibold tabular-nums text-foreground">
                {g.weight}%
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{g.title}</p>
                {g.description && (
                  <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))] leading-relaxed">{g.description}</p>
                )}
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setEditing(g);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(g)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--ink-strong)/0.02)]">
        <UserSearch className="h-3.5 w-3.5 text-[hsl(var(--ink-subtle))]" />
        <span className="text-xs text-[hsl(var(--ink-muted))]">Extra reviewer</span>
        <div className="w-56">
          <Select
            value={participant.extra_reviewer_id ?? NONE}
            onValueChange={async (v) => {
              try {
                await setExtraReviewer.mutateAsync({
                  participantId: participant.id,
                  reviewerId: v === NONE ? null : v,
                });
                toast.success("Reviewer updated");
              } catch (err) {
                toast.error(friendlyError(err, "Could not update the reviewer"));
              }
            }}
            disabled={!canPickReviewer}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {reviewerOptions.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-[11px] text-[hsl(var(--ink-subtle))]">
          Optional — can add comments alongside the manager's assessment.
        </span>
      </div>

      <GoalFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        remainingWeight={100 - total + (editing?.weight ?? 0)}
        onSubmit={async (values) => {
          try {
            if (editing) await updateGoal.mutateAsync({ id: editing.id, values });
            else await createGoal.mutateAsync(values);
            toast.success(editing ? "Goal updated" : "Goal added");
            setFormOpen(false);
          } catch (err) {
            toast.error(friendlyError(err, "Could not save the goal"));
          }
        }}
        saving={createGoal.isPending || updateGoal.isPending}
      />
    </div>
  );
}

function GoalFormModal({
  open,
  onOpenChange,
  editing,
  remainingWeight,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Goal | null;
  remainingWeight: number;
  onSubmit: (values: GoalFormValues) => Promise<void>;
  saving: boolean;
}) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: emptyGoalForm(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? { title: editing.title, description: editing.description ?? "", weight: editing.weight }
        : { ...emptyGoalForm(), weight: Math.min(Math.max(remainingWeight, 1), 100) },
    );
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "Add goal"}</DialogTitle>
          <DialogDescription>
            Weights across all of this person's goals must total 100% before assessments can be
            submitted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
              Title<span className="ml-0.5 text-[hsl(var(--accent-red))]">*</span>
            </Label>
            <Input placeholder="e.g. Ship the Q3 onboarding revamp" {...form.register("title")} />
            {errors.title && <p className="text-[11px] text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
              Description
            </Label>
            <Textarea rows={3} placeholder="What does success look like?" {...form.register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
              Weight (%)<span className="ml-0.5 text-[hsl(var(--accent-red))]">*</span>
            </Label>
            <Input type="number" min={1} max={100} {...form.register("weight")} />
            {errors.weight && <p className="text-[11px] text-destructive">{errors.weight.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantGoalsCard;
