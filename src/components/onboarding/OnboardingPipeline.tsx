import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import type { OnboardingStep, OnboardingStepKey } from "@/hooks/useOnboarding";

interface OnboardingPipelineProps {
  steps: OnboardingStep[];
  currentKey: OnboardingStepKey;
  size?: "sm" | "md";
  /** "nodes" = icon rail (default). "bars" = minimal segmented progress bars. */
  variant?: "nodes" | "bars";
}

/** Single visual grammar for "where am I in setup" — used both as the slim
 * top-of-page strip and the Setup Dashboard hero. Keep it the only one. */
export function OnboardingPipeline({ steps, currentKey, size = "md", variant = "nodes" }: OnboardingPipelineProps) {
  const nodeDim = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
  const labelClass = size === "sm" ? "text-[10px]" : "text-[11px]";
  const colWidth = size === "sm" ? "w-11" : "w-16";
  const lineOffset = size === "sm" ? "mt-3.5" : "mt-5";

  if (variant === "bars") {
    return (
      <ol className="flex items-center justify-center gap-2" aria-label="Setup progress">
        {steps.map((step) => {
          const isCurrent = step.key === currentKey;
          const color =
            step.status === "done"
              ? "hsl(var(--accent-green))"
              : step.status === "skipped"
              ? "hsl(var(--accent-purple) / 0.5)"
              : isCurrent
              ? `hsl(var(${step.accent}))`
              : "hsl(var(--hairline))";
          return (
            <li key={step.key}>
              <span className="sr-only">{step.label}</span>
              <span
                className="block h-[3px] w-9 rounded-full"
                style={{ backgroundColor: color, transitionProperty: "background-color", transitionDuration: "200ms" }}
                aria-hidden
              />
            </li>
          );
        })}
      </ol>
    );
  }


  return (
    <ol className="flex items-start" aria-label="Setup progress">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isCurrent = step.key === currentKey;
        const isDone = step.status === "done";
        const isSkipped = step.status === "skipped";

        const nodeStyle = isDone
          ? { backgroundColor: "hsl(var(--accent-green) / 0.14)", color: "hsl(var(--accent-green))" }
          : isSkipped
          ? { backgroundColor: "hsl(var(--accent-purple) / 0.14)", color: "hsl(var(--accent-purple-ink))" }
          : isCurrent
          ? {
              backgroundColor: `hsl(var(${step.accent}) / 0.14)`,
              color: `hsl(var(${step.accent}))`,
              boxShadow: `0 0 0 2px hsl(var(${step.accent}) / 0.35)`,
            }
          : { color: "hsl(var(--ink-subtle))", border: "1px solid hsl(var(--hairline))" };

        const canClick = step.href && (isDone || isSkipped || isCurrent);

        const node = (
          <div className={`flex ${colWidth} shrink-0 flex-col items-center gap-1.5`}>
            <span
              className={`flex ${nodeDim} items-center justify-center rounded-full`}
              style={{ ...nodeStyle, transitionProperty: "background-color, box-shadow, color", transitionDuration: "200ms" }}
            >
              {isDone ? (
                <Check className={iconDim} strokeWidth={3} />
              ) : isSkipped ? (
                <Minus className={iconDim} />
              ) : (
                <Icon className={iconDim} />
              )}
            </span>
            <span
              className={`${labelClass} font-medium leading-none ${
                isCurrent ? "text-foreground" : "text-[hsl(var(--ink-subtle))]"
              }`}
            >
              {step.label}
            </span>
          </div>
        );

        return (
          <li key={step.key} className="contents">
            {canClick ? (
              <Link
                to={step.href!}
                className="rounded-lg py-1 active:scale-[0.96] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {node}
              </Link>
            ) : (
              node
            )}
            {i < steps.length - 1 && (
              <span
                className={`${lineOffset} h-[2px] flex-1 rounded-full`}
                style={{
                  backgroundColor: step.status === "done" ? "hsl(var(--accent-green) / 0.5)" : "hsl(var(--hairline))",
                  transitionProperty: "background-color",
                  transitionDuration: "200ms",
                }}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default OnboardingPipeline;
