import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { TrackerStep } from "@/lib/trackerSteps";

export type { TrackerStep };

export interface ProgressTrackerProps {
  title: string;
  steps: TrackerStep[];
  /** Collapsed by default except where the viewer's attention is required. */
  defaultOpen?: boolean;
  /** Navigation only — the tracker never collects completion. */
  onStepClick?: (id: string) => void;
}

const RING_R = 5.5;
const RING_CIRC = 2 * Math.PI * RING_R;

/**
 * System-driven sequential tracker card. Renders appraisal state (done /
 * active / pending) derived elsewhere — there are no checkboxes and nothing
 * here mutates data. See src/lib/trackerSteps.ts for the step derivation.
 */
export function ProgressTracker({ title, steps, defaultOpen = true, onStepClick }: ProgressTrackerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = steps.filter((s) => s.status === "done").length;
  const complete = steps.length > 0 && doneCount === steps.length;
  const pct = steps.length > 0 ? doneCount / steps.length : 0;

  // Strikethrough animates only when a step flips to done while mounted;
  // steps that were already done on first render paint fully struck.
  const seenUndone = useRef<Set<string>>(new Set());
  steps.forEach((s) => {
    if (s.status !== "done") seenUndone.current.add(s.id);
  });

  return (
    <div className="rounded-xl border border-hairline bg-surface-raised shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          {complete ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-green">
              <Check size={10} strokeWidth={3} className="text-white" />
            </span>
          ) : (
            <>
              <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity group-hover:opacity-0">
                {open ? (
                  <ChevronDown size={14} className="text-ink-muted" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden="true">
                    <circle
                      cx="8"
                      cy="8"
                      r={RING_R}
                      fill="none"
                      strokeWidth="2"
                      className="stroke-hairline"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r={RING_R}
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${pct * RING_CIRC} ${RING_CIRC}`}
                      transform="rotate(-90 8 8)"
                      className="pt-ring-fill stroke-ink-strong"
                    />
                  </svg>
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                {open ? (
                  <ChevronDown size={14} className="text-ink-strong" />
                ) : (
                  <ChevronRight size={14} className="text-ink-strong" />
                )}
              </span>
            </>
          )}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs tabular-nums text-ink-subtle">
          {doneCount}/{steps.length}
        </span>
      </button>

      <div className={`pt-collapse ${open ? "is-open" : ""}`}>
        <div>
          <ul aria-label={`${title} steps`} className="px-4 pb-3.5 pt-0.5">
            {steps.map((step) => (
              <li
                key={step.id}
                aria-current={step.status === "active" ? "step" : undefined}
                className={`flex items-center gap-2.5 py-[5px] ${open ? "pt-step-enter" : ""}`}
              >
                <StepDot status={step.status} />
                <StepLabel step={step} animateStrike={seenUndone.current.has(step.id)} onStepClick={onStepClick} />
                {step.status === "active" && step.sub && (
                  <span className="text-[11px] tabular-nums text-ink-muted">{step.sub}</span>
                )}
                {step.status === "active" && step.action && <ActionChip action={step.action} />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StepDot({ status }: { status: TrackerStep["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-subtle">
        <Check size={9} strokeWidth={2.5} className="text-ink-subtle" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-strong">
        <ArrowRight size={9} strokeWidth={2.5} className="text-ink-strong" />
      </span>
    );
  }
  return <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-ink-subtle" />;
}

function StepLabel({
  step,
  animateStrike,
  onStepClick,
}: {
  step: TrackerStep;
  animateStrike: boolean;
  onStepClick?: (id: string) => void;
}) {
  const className = [
    "text-[13.5px]",
    step.status === "done" && `pt-strike is-done ${animateStrike ? "" : "no-anim"} text-ink-subtle`,
    step.status === "active" && "font-medium text-foreground",
    step.status === "pending" && "text-ink-subtle",
  ]
    .filter(Boolean)
    .join(" ");

  if (onStepClick) {
    return (
      <button type="button" onClick={() => onStepClick(step.id)} className={`${className} text-left`}>
        {step.label}
      </button>
    );
  }
  return <span className={className}>{step.label}</span>;
}

function ActionChip({ action }: { action: NonNullable<TrackerStep["action"]> }) {
  const className =
    "ml-auto shrink-0 rounded-md border border-hairline px-2 py-0.5 text-[11.5px] font-medium text-foreground transition-colors hover:border-ink-subtle";
  const label = `${action.label} →`;
  if (action.href.startsWith("#")) {
    return (
      <a href={action.href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={action.href} className={className}>
      {label}
    </Link>
  );
}

export default ProgressTracker;
