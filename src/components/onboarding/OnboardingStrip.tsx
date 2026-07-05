import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";


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
  const { steps, isOnboarding, completedCount, totalSteps } = useOnboarding();
  const { activeStep } = useOnboardingContext();

  if (!isOnboarding) return null;

  const active =
    (activeStep && steps.find((s) => s.key === activeStep)) ||
    steps.find((s) => s.status === "current") ||
    steps[0];

  return (
    <div
      className={
        "border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] " +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {steps.map((step) => (
            <Segment key={step.key} step={step} isActive={step.key === active.key} />
          ))}
        </div>
        <p className="text-[11px] text-[hsl(var(--ink-subtle))] tabular-nums shrink-0">
          {completedCount}/{totalSteps}
        </p>
      </div>
    </div>
  );
}

export default OnboardingStrip;
