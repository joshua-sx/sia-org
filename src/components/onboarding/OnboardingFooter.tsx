import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";

export function OnboardingFooter() {
  const navigate = useNavigate();
  const { isOnboarding, steps, markComplete, markSkipped, nextStepAfter, previousStepBefore, saving } =
    useOnboarding();
  const { activeStep, readiness } = useOnboardingContext();
  const [skipOpen, setSkipOpen] = useState(false);

  if (!isOnboarding || !activeStep) return null;

  const step = steps.find((s) => s.key === activeStep);
  if (!step) return null;

  const r = readiness[activeStep] ?? { ready: false };
  const previous = previousStepBefore(activeStep);
  const next = nextStepAfter(activeStep);
  const isAlreadyDone = step.done || step.skipped;

  const goToNextOrDashboard = () => {
    if (next?.href) navigate(next.href);
    else navigate("/dashboard");
  };

  const handleComplete = async () => {
    try {
      await markComplete(activeStep);
      const isLast = !next;
      toast.success(isLast ? "Setup complete — welcome to SIA." : `${step.label} step complete.`);
      goToNextOrDashboard();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not complete step");
    }
  };

  const handleSkip = async () => {
    try {
      await markSkipped(activeStep);
      toast.info(`Skipped ${step.label} — you can come back to this any time.`);
      setSkipOpen(false);
      goToNextOrDashboard();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not skip step");
    }
  };

  const statusLine = isAlreadyDone
    ? step.done
      ? `${step.label} step is complete.`
      : `${step.label} step was skipped.`
    : r.ready
    ? r.hint ?? "Ready to continue."
    : r.hint ?? `Complete this step to continue.`;

  return (
    <div className="sticky bottom-0 z-30 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {previous?.href ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(previous.href!)}
              className="text-[hsl(var(--ink-muted))] active:scale-[0.96]"
              style={{ transitionProperty: "color, transform" }}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to {previous.label}
            </Button>
          ) : (
            <span className="text-xs text-[hsl(var(--ink-subtle))]">First step</span>
          )}
          <span className="hidden md:inline text-[hsl(var(--hairline))]">|</span>
          <p
            className={
              "hidden md:block text-xs tabular-nums " +
              (r.ready || isAlreadyDone
                ? "text-[hsl(var(--accent-green))]"
                : "text-[hsl(var(--ink-muted))]")
            }
          >
            {r.ready && !isAlreadyDone && (
              <Check className="inline h-3 w-3 mr-1" strokeWidth={3} />
            )}
            {statusLine}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAlreadyDone && (
            <Popover open={skipOpen} onOpenChange={setSkipOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[hsl(var(--ink-muted))]">
                  Skip this step
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <p className="text-sm font-medium text-foreground">Skip {step.label}?</p>
                <p className="mt-1 text-xs text-[hsl(var(--ink-muted))]">
                  You can come back to this any time from the sidebar. It won't block later steps.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSkipOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSkip} disabled={saving}>
                    Skip step
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {isAlreadyDone ? (
            <Button
              size="sm"
              onClick={goToNextOrDashboard}
              className="active:scale-[0.96]"
              style={{ transitionProperty: "transform" }}
            >
              {next ? `Continue to ${next.label}` : "Go to dashboard"}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={!r.ready || saving}
              className="active:scale-[0.96]"
              style={{ transitionProperty: "transform, opacity" }}
            >
              {next ? "Complete step" : "Finish setup"}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingFooter;
