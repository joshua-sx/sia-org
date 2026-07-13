const MAIN_STEPS = ["Account", "Structure", "People", "Launch"] as const;

const STEP_ACCENTS = [
  "--accent-blue",
  "--accent-red",
  "--accent-yellow",
  "--accent-green",
] as const;

interface GlobalStepBarProps {
  /** 1-indexed active step in the 4-step flow */
  activeStep: 1 | 2 | 3 | 4;
  /** How many of the 4 main steps are fully complete (0–4) */
  completedThrough?: number;
}

export function GlobalStepBar({ activeStep, completedThrough = activeStep - 1 }: GlobalStepBarProps) {
  return (
    <div className="border-b border-[hsl(var(--hairline))] px-6 md:px-16 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--ink-subtle))] mb-3">
        Step {activeStep} of 4
      </p>
      <div className="flex gap-1 mb-3.5">
        {MAIN_STEPS.map((_, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum <= completedThrough;
          const isActive = stepNum === activeStep;
          const accent = STEP_ACCENTS[i];
          return (
            <div
              key={stepNum}
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor: isComplete || isActive
                  ? `hsl(var(${accent}))`
                  : "hsl(var(--hairline))",
                opacity: isActive && !isComplete ? 1 : isComplete ? 1 : 0.35,
              }}
            />
          );
        })}
      </div>
      <div className="flex">
        {MAIN_STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === activeStep;
          const isComplete = stepNum <= completedThrough;
          const accent = STEP_ACCENTS[i];
          return (
            <div
              key={label}
              className="flex-1 text-[13px]"
              style={{
                color: isActive || isComplete
                  ? `hsl(var(${accent}))`
                  : "hsl(var(--ink-subtle))",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GlobalStepBar;
