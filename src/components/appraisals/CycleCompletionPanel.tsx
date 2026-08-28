import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCycleCloseReadiness } from "@/hooks/useCycleCloseReadiness";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { PanelNotice } from "@/components/appraisals/PanelNotice";

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
        <span className="font-normal text-ink-subtle"> / {total}</span>
      </p>
    </div>
  );
}

export function CycleCompletionPanel({
  cycleId,
  status,
  closedAt,
  closeNote,
  isHr,
  onComplete,
  completing,
}: {
  cycleId: string;
  status: "active" | "completed";
  closedAt?: string | null;
  closeNote?: string | null;
  isHr: boolean;
  onComplete: (opts: { force: boolean; note?: string }) => Promise<void>;
  completing: boolean;
}) {
  const { data: readiness, isLoading, isError, error, refetch } = useCycleCloseReadiness(cycleId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState("");

  const requiresForce = readiness?.requires_force ?? false;
  const canClose = (readiness?.can_close ?? false) || requiresForce;
  const noteRequired = requiresForce && note.trim().length === 0;

  if (status === "completed") {
    return (
      <section className="mt-6 rounded-xl border border-hairline bg-surface-raised px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="h-4 w-4 text-ink-muted" />
          Cycle closed
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          {closedAt
            ? `Closed on ${new Date(closedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}. `
            : ""}
          Goals, ratings and acknowledgements are permanently locked. The record and activity log
          remain available to export.
        </p>
        {closeNote && (
          <p className="mt-2 rounded-lg bg-hairline/[0.4] px-3 py-2 text-xs text-ink-muted">
            <span className="font-medium text-foreground">Closing note: </span>
            {closeNote}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-hairline bg-surface-raised">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Close this cycle</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Closing freezes every rating and comment for good. It can't be undone.
          </p>
        </div>
        {isHr && (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canClose || completing || isLoading}
            variant="outline"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {completing ? "Closing…" : "Close cycle"}
          </Button>
        )}
      </div>

      {isHr && requiresForce && (
        <div className="border-t border-hairline [&>div]:border-b-0">
          <PanelNotice
            text={`${readiness?.missing_final} of ${readiness?.participants} participant(s) have no final assessment. You can still close, but you'll need to record a reason.`}
          />
        </div>
      )}

      {isLoading && (
        <div className="border-t border-hairline px-5 py-6">
          <QueryLoading label="Checking cycle progress" rows={2} />
        </div>
      )}

      {isError && (
        <div className="border-t border-hairline px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      {readiness && !isLoading && (
        <div className="grid grid-cols-2 gap-4 border-t border-hairline px-5 py-4 sm:grid-cols-4">
          <Stat label="Participants" value={readiness.participants} total={readiness.participants} />
          <Stat label="Interim submitted" value={readiness.interim_submitted} total={readiness.participants} />
          <Stat label="Final submitted" value={readiness.final_submitted} total={readiness.participants} />
          <Stat label="Acknowledged" value={readiness.acknowledged} total={readiness.participants} />
        </div>
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) setNote("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {requiresForce ? "Close with incomplete assessments?" : "Close this cycle?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requiresForce
                ? `${readiness?.missing_final} participant(s) have no final assessment. Closing now locks the cycle in that state permanently. Record why.`
                : "Every rating, comment and acknowledgement will be locked permanently. This cannot be undone."}
              {readiness && readiness.missing_acknowledgement > 0 && !requiresForce && (
                <>
                  {" "}
                  {readiness.missing_acknowledgement} employee(s) haven't acknowledged their review yet.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="close-note" className="text-xs">
              Closing note {requiresForce ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="close-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                requiresForce
                  ? "e.g. Cycle closed early at the request of the executive team."
                  : "Anything worth recording alongside this cycle."
              }
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              disabled={noteRequired || completing}
              onClick={async () => {
                await onComplete({ force: requiresForce, note: note.trim() || undefined });
                setConfirmOpen(false);
                setNote("");
              }}
            >
              {completing ? "Closing…" : requiresForce ? "Close anyway" : "Close cycle"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
