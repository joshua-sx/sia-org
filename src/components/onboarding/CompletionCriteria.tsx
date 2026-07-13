import { Info, Check, Circle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface CompletionCriterion {
  label: string;
  met: boolean;
}

interface CompletionCriteriaProps {
  criteria: CompletionCriterion[];
  triggerLabel?: string;
  accent?: string; // css var name, e.g. "--accent-green"
}

/**
 * Inline "done when" trigger. Replaces a persistent sidebar card with a
 * link + info icon that reveals criteria on hover.
 */
export function CompletionCriteria({
  criteria,
  triggerLabel = "What's needed to complete this step",
  accent = "--accent-blue",
}: CompletionCriteriaProps) {
  if (criteria.length === 0) return null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
          style={{ color: `hsl(var(${accent}))` }}
        >
          <Info className="h-3.5 w-3.5" />
          {triggerLabel}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-4">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: `hsl(var(${accent}))` }}
        >
          Done when
        </p>
        <ul className="mt-3 space-y-2.5">
          {criteria.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              {c.met ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  strokeWidth={3}
                  style={{ color: "hsl(var(--accent-green))" }}
                />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(var(--ink-subtle))]" />
              )}
              <span className={c.met ? "text-foreground" : "text-[hsl(var(--ink-muted))]"}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

export default CompletionCriteria;
