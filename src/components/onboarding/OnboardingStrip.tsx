import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding";

const StepDot = ({ step }: { step: OnboardingStep }) => {
  const { status, icon: Icon, accent } = step;

  if (status === "done") {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: "hsl(var(--accent-green))" }}
      >
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: "hsl(var(--accent-yellow) / 0.18)" }}
      >
        <Minus className="h-4 w-4" style={{ color: "hsl(45, 70%, 32%)" }} />
      </div>
    );
  }

  if (status === "current") {
    return (
      <div className="relative flex h-8 w-8 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `hsl(var(${accent}) / 0.2)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="relative flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `hsl(var(${accent}) / 0.15)` }}
        >
          <Icon className="h-4 w-4" style={{ color: `hsl(var(${accent}))` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--hairline))] bg-background">
      <Icon className="h-4 w-4 text-[hsl(var(--ink-subtle))]" />
    </div>
  );
};

export function OnboardingStrip({ className }: { className?: string }) {
  const { steps, isOnboarding, completedCount, totalSteps, markSkipped } = useOnboarding();

  if (!isOnboarding) return null;

  return (
    <div
      className={
        "border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] " +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
            Getting set up · <span className="tabular-nums">{completedCount}/{totalSteps}</span>
          </p>
          <button
            onClick={async () => {
              // Skip remaining steps at once — sends the user to their dashboard
              const pending = steps.filter((s) => !s.done && !s.skipped && s.key !== "account");
              for (const s of pending) await markSkipped(s.key);
            }}
            className="text-xs text-[hsl(var(--ink-muted))] hover:text-foreground transition-colors active:scale-[0.96]"
            style={{ transitionProperty: "color, transform" }}
          >
            Skip setup →
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1">
          {steps.map((step, i) => {
            const Inner = (
              <div className="flex items-center gap-2.5">
                <StepDot step={step} />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground leading-tight">{step.label}</p>
                  <p className="text-[11px] text-[hsl(var(--ink-subtle))] leading-tight capitalize">
                    {step.status === "current" ? "In progress" : step.status}
                  </p>
                </div>
              </div>
            );
            const clickable = step.href && (step.done || step.skipped || step.status === "current");
            return (
              <div key={step.key} className="flex flex-1 items-center gap-1">
                {clickable ? (
                  <Link
                    to={step.href!}
                    className="flex items-center rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--ink-strong)/0.04)] transition-colors"
                    style={{ transitionProperty: "background-color" }}
                  >
                    {Inner}
                  </Link>
                ) : (
                  <div className="flex items-center px-2 py-1.5 opacity-80">{Inner}</div>
                )}
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OnboardingStrip;
