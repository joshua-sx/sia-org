import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useOrgScoringSettings } from "@/hooks/useOrgScoringSettings";
import {
  orgScoringFormSchema,
  emptyOrgScoringForm,
  type OrgScoringFormValues,
} from "@/lib/orgScoringSchema";
import { friendlyError } from "@/lib/siaErrors";

/** HR-admin-only org interim/final defaults — snapshotted onto each cycle at launch. */
export function OrgScoringSettingsCard() {
  const { data, isLoading, updateWeights } = useOrgScoringSettings();
  const [open, setOpen] = useState(false);

  const form = useForm<OrgScoringFormValues>({
    resolver: zodResolver(orgScoringFormSchema),
    defaultValues: emptyOrgScoringForm(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(data ? { ...data } : emptyOrgScoringForm());
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        await updateWeights.mutateAsync(values);
        toast.success("Scoring split updated");
        setOpen(false);
      } catch (err) {
        toast.error(friendlyError(err, "Could not save the scoring split"));
      }
    },
    () => {
      toast.error("Fix the highlighted fields to continue");
    },
  );

  if (isLoading || !data) return null;

  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-raised px-5 py-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-ink-subtle">
          Org-wide scoring split
        </p>
        <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
          Interim {data.interim_weight_pct}% · Final {data.final_weight_pct}%
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Scoring split</DialogTitle>
            <DialogDescription>
              Default interim/final split for new cycle launches. Each launched cycle keeps
              the weights that were in effect at launch — changing this does not alter
              in-flight cycles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                  Interim %
                </Label>
                <Input type="number" min={0} max={100} {...form.register("interim_weight_pct")} />
                {errors.interim_weight_pct && (
                  <p className="text-[11px] text-destructive">{errors.interim_weight_pct.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                  Final %
                </Label>
                <Input type="number" min={0} max={100} {...form.register("final_weight_pct")} />
                {errors.final_weight_pct && (
                  <p className="text-[11px] text-destructive">{errors.final_weight_pct.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateWeights.isPending}>
                {updateWeights.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
