import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  cycleFormSchema,
  emptyCycleForm,
  type CycleFormValues,
} from "@/lib/cycleSchema";
import { friendlyError } from "@/lib/siaErrors";
import { useAppraisalCycles, type AppraisalCycle } from "@/hooks/useAppraisalCycles";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: AppraisalCycle | null;
  onSaved?: (cycle: AppraisalCycle) => void;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
        {label}
        {required && <span className="ml-0.5 text-[hsl(var(--accent-red))]">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export function CycleFormModal({ open, onOpenChange, editing, onSaved }: Props) {
  const { createCycle, updateCycle } = useAppraisalCycles();

  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema),
    defaultValues: emptyCycleForm(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            name: editing.name,
            goal_window_start: editing.goal_window_start,
            goal_window_end: editing.goal_window_end,
            interim_window_start: editing.interim_window_start,
            interim_window_end: editing.interim_window_end,
            final_window_start: editing.final_window_start,
            final_window_end: editing.final_window_end,
            acknowledgement_due: editing.acknowledgement_due,
          }
        : emptyCycleForm(),
    );
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const saving = createCycle.isPending || updateCycle.isPending;
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const cycle = editing
        ? await updateCycle.mutateAsync({ id: editing.id, values })
        : await createCycle.mutateAsync(values);
      toast.success(editing ? "Cycle updated" : "Cycle created");
      onOpenChange(false);
      onSaved?.(cycle);
    } catch (err) {
      toast.error(friendlyError(err, "Could not save the cycle"));
    }
  });

  const dateField = (name: keyof CycleFormValues, label: string) => (
    <Field label={label} required error={errors[name]?.message}>
      <Input type="date" {...form.register(name)} />
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit appraisal cycle" : "New appraisal cycle"}</DialogTitle>
          <DialogDescription>
            Define the review timeline. Each window opens and closes on the dates you pick
            (inclusive), and windows must follow each other in order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Cycle name" required error={errors.name?.message}>
            <Input placeholder="e.g. FY26 Annual Review" {...form.register("name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {dateField("goal_window_start", "Goal setting opens")}
            {dateField("goal_window_end", "Goal setting closes")}
            {dateField("interim_window_start", "Interim opens")}
            {dateField("interim_window_end", "Interim closes")}
            {dateField("final_window_start", "Final opens")}
            {dateField("final_window_end", "Final closes")}
          </div>
          {dateField("acknowledgement_due", "Acknowledgement due")}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create draft cycle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CycleFormModal;
