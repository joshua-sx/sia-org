import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingNavFooterProps {
  onBack: () => void;
  onContinue: () => void;
  canGoBack?: boolean;
  continueDisabled?: boolean;
  continueLabel?: string;
}

/** Minimal onboarding footer: Back on the left, Continue on the right. */
export function OnboardingNavFooter({
  onBack,
  onContinue,
  canGoBack = true,
  continueDisabled = false,
  continueLabel = "Continue",
}: OnboardingNavFooterProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-6 py-3 md:px-16">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="text-[hsl(var(--ink-muted))]"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back
        </Button>
        <Button size="sm" type="button" onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default OnboardingNavFooter;
