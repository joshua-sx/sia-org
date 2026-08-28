import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEmployees } from "@/hooks/useEmployees";
import { useOnboardingContext } from "./OnboardingContext";

/** Optional skip control for the app header during onboarding. */
export function OnboardingSkipControl() {
  const navigate = useNavigate();
  const { isOnboarding, steps, markSkipped, finishSetup, nextStepAfter, saving } = useOnboarding();
  const { activeStep } = useOnboardingContext();
  const { data: employees = [] } = useEmployees();
  const [open, setOpen] = useState(false);

  if (!isOnboarding || !activeStep || activeStep === "structure") return null;

  const step = steps.find((s) => s.key === activeStep);
  if (!step || step.done || step.skipped) return null;

  const next = nextStepAfter(activeStep);
  const opensToUnusableLaunch =
    activeStep === "people" && employees.length === 0 && next?.key === "cycle";

  const handleSkip = async () => {
    try {
      await markSkipped(activeStep);
      toast.info(`Skipped ${step.label} — you can come back any time.`);
      setOpen(false);
      if (next?.href) navigate(next.href);
      else await finishSetup();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not skip step";
      toast.error(message);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex min-h-10 items-center px-2 text-xs text-ink-subtle hover:text-ink-muted active:scale-[0.96]"
          style={{ transitionProperty: "color, transform", transitionDuration: "150ms" }}
        >
          Skip this step
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-medium text-foreground">Skip {step.label}?</p>
        <p className="mt-1 text-xs text-ink-muted">
          You can come back to this any time from the sidebar.
        </p>
        {opensToUnusableLaunch && (
          <p className="mt-2 text-xs leading-relaxed text-accent-yellow-ink">
            Launch needs at least one employee — you won't be able to create a
            cycle until you add one.
          </p>
        )}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="outline" onClick={handleSkip} disabled={saving}>
            Skip step
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default OnboardingSkipControl;
