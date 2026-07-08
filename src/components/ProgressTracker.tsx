import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackerStep {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
  /** Secondary mono text on the active row, e.g. "18/30 submitted". */
  sub?: string;
  /** Optional chip on the active row, deep-links to the owed action. */
  action?: { label: string; href: string };
}

export interface ProgressTrackerProps {
  title: string;
  steps: TrackerStep[];
  /** Collapsed by default unless the viewer's action is required or it's a first encounter. */
  defaultOpen?: boolean;
  /** Navigation only — never completion. */
  onStepClick?: (id: string) => void;
}

/**
 * System-driven, sequential progress tracker. It renders the state passed in
 * `steps` and never collects it: there are no checkboxes and clicking a row
 * only navigates. Counter, progress ring, and complete state are all derived
 * from `steps` — there is no separate progress prop.
 */
export function ProgressTracker({ title, steps, defaultOpen, onStepClick }: ProgressTrackerProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const isComplete = total > 0 && doneCount === total;

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <HeaderIcon open={open} isComplete={isComplete} ratio={total > 0 ? doneCount / total : 0} />
        <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-[hsl(var(--ink-subtle))]">
          {doneCount}/{total}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <ul className="px-4 pb-3.5 pt-0.5">
            {steps.map((step) => (
              <StepRow key={step.id} step={step} onStepClick={onStepClick} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HeaderIcon({
  open,
  isComplete,
  ratio,
}: {
  open: boolean;
  isComplete: boolean;
  ratio: number;
}) {
  if (isComplete) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent-green))]">
        <Check size={10} strokeWidth={3} className="text-white" />
      </span>
    );
  }

  // Expanded: a plain chevron that points down (open) or right (hover pre-expand).
  if (open) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        <ChevronDown size={14} className="text-[hsl(var(--ink-muted))]" />
      </span>
    );
  }

  // Collapsed & in progress: the ring shows completion, the chevron swaps in on hover.
  return (
    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
      <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity group-hover:opacity-0 motion-reduce:transition-none">
        <ProgressRing ratio={ratio} />
      </span>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none">
        <ChevronRight size={14} className="text-foreground" />
      </span>
    </span>
  );
}

function ProgressRing({ ratio }: { ratio: number }) {
  const r = 5.5;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
      <circle cx="8" cy="8" r={r} fill="none" stroke="hsl(var(--hairline))" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${circumference * ratio} ${circumference}`}
        transform="rotate(-90 8 8)"
        className="transition-[stroke-dasharray] duration-300 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

function StepRow({
  step,
  onStepClick,
}: {
  step: TrackerStep;
  onStepClick?: (id: string) => void;
}) {
  const clickable = !!onStepClick;
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-md py-[5px] transition-colors motion-reduce:transition-none",
        clickable && "-mx-1 cursor-pointer px-1 hover:bg-[hsl(var(--ink-strong)/0.03)]",
      )}
      onClick={clickable ? () => onStepClick!(step.id) : undefined}
    >
      <StepIcon status={step.status} />
      <span
        className={cn(
          "relative text-[13.5px] after:absolute after:left-0 after:top-1/2 after:h-px after:bg-current after:transition-[width] after:duration-[450ms] after:ease-out after:content-[''] motion-reduce:after:transition-none",
          step.status === "done" && "text-[hsl(var(--ink-subtle))] after:w-full",
          step.status === "active" && "font-medium text-foreground after:w-0",
          step.status === "pending" && "text-[hsl(var(--ink-subtle))] after:w-0",
        )}
      >
        {step.label}
      </span>

      {step.status === "active" && step.sub && (
        <span className="ml-1 font-mono text-[11px] tabular-nums text-[hsl(var(--ink-muted))]">
          {step.sub}
        </span>
      )}

      {step.status === "active" && step.action && (
        <Link
          to={step.action.href}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto rounded-md border border-[hsl(var(--hairline))] px-2 py-0.5 text-[11.5px] font-medium text-foreground transition-colors hover:border-[hsl(var(--ink-subtle))] motion-reduce:transition-none"
        >
          {step.action.label} →
        </Link>
      )}
    </li>
  );
}

function StepIcon({ status }: { status: TrackerStep["status"] }) {
  switch (status) {
    case "done":
      return (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--ink-subtle))]">
          <Check size={9} strokeWidth={2.5} className="text-[hsl(var(--ink-subtle))]" />
        </span>
      );
    case "active":
      return (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-foreground">
          <ArrowRight size={9} strokeWidth={2.5} className="text-foreground" />
        </span>
      );
    case "pending":
      return (
        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-[hsl(var(--ink-subtle))]" />
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
