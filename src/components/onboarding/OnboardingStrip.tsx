import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { useOnboarding, type OnboardingStep, type OnboardingStepKey } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";

const STEP_HINT: Record<OnboardingStepKey, string> = {
  account: "Your account is ready.",
  structure: "Define the levels of your organization and add your first units.",
  people: "Add the people who'll take part in appraisal cycles.",
  cycle: "Create your first appraisal cycle to go live.",
};

function Segment({ step, isActive }: { step: OnboardingStep; isActive: boolean }) {
  const { status, label, accent } = step;

  const base =
    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors";
  const textActive = isActive || status === "current";

  let inner;
  if (status === "done") {
    inner = (
      <span
        className={base}
        style={{
          backgroundColor: `hsl(var(--accent-green) / 0.14)`,
          color: `hsl(var(--accent-green))`,
        }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
        {label}
      </span>
    );
  } else if (status === "skipped") {
    inner = (
      <span
        className={base}
        style={{
          backgroundColor: `hsl(var(--accent-yellow) / 0.14)`,
          color: `hsl(45, 55%, 32%)`,
        }}
      >
        <Minus className="h-3 w-3" />
        {label}
      </span>
    );
  } else if (textActive) {
    inner = (
      <span
        className={base}
        style={{
          backgroundColor: `hsl(var(${accent}) / 0.14)`,
          color: `hsl(var(${accent}))`,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(var(${accent}))` }} />
        {label}
      </span>
    );
  } else {
    inner = (
      <span
        className={`${base} border border-[hsl(var(--hairline))] text-[hsl(var(--ink-subtle))]`}
      >
        {label}
      </span>
    );
  }

  const canClick = step.href && (step.done || step.skipped || status === "current" || isActive);
  if (canClick) {
    return (
      <Link to={step.href!} className="active:scale-[0.97] transition-transform">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function OnboardingStrip({ className }: { className?: string }) {
  const { steps, isOnboarding, completedCount, totalSteps, stepIndexByKey } = useOnboarding();
  const { activeStep } = useOnboardingContext();

  if (!isOnboarding) return null;

  const active =
    (activeStep && steps.find((s) => s.key === activeStep)) ||
    steps.find((s) => s.status === "current") ||
    steps[0];
  const activeIndex = stepIndexByKey(active.key);
  const hint = STEP_HINT[active.key];

  return (
    <div
      className={
        "border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] " +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
            <span className="tabular-nums">Step {activeIndex + 1} of {totalSteps}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="text-foreground font-semibold normal-case tracking-normal">
              {active.label}
            </span>
          </p>
          <p className="text-[11px] text-[hsl(var(--ink-subtle))] tabular-nums">
            {completedCount}/{totalSteps} complete
          </p>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {steps.map((step) => (
            <Segment key={step.key} step={step} isActive={step.key === active.key} />
          ))}
        </div>

        {hint && (
          <p className="mt-2 text-xs text-[hsl(var(--ink-muted))]">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default OnboardingStrip;
