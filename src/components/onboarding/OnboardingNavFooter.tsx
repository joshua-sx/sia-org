import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingNavFooterProps {
  onBack: () => void;
  onContinue: () => void;
  canGoBack?: boolean;
  continueDisabled?: boolean;
  continueLabel?: string;
  /** Shown next to Continue, e.g. "Add at least 1 employee to continue." */
  hint?: string;
}

/** Always-visible onboarding bar: Back on the left, Continue/Finish on the right. */
export function OnboardingNavFooter({
  onBack,
  onContinue,
  canGoBack = true,
  continueDisabled = false,
  continueLabel = "Continue",
  hint,
}: OnboardingNavFooterProps) {
  return (
    <div className="shrink-0 border-t border-hairline bg-surface-raised/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 md:px-10">
        <Button
          variant="ghost"
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="h-10 text-ink-muted"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {hint && (
            <p className="hidden max-w-sm truncate text-xs text-ink-muted sm:block" title={hint}>
              {hint}
            </p>
          )}
          <Button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled}
            className="h-10 min-w-[140px] shrink-0"
          >
            {continueLabel}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {hint && <p className="px-5 pb-3 text-xs text-ink-muted sm:hidden">{hint}</p>}
    </div>
  );
}

export default OnboardingNavFooter;
