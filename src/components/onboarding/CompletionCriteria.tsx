import { Info, Check, Circle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
 * link + info icon that reveals criteria on click/tap/keyboard focus —
 * a HoverCard would be unreachable on touch devices.
 */
export function CompletionCriteria({
  criteria,
  triggerLabel = "What's needed to complete this step",
  accent = "--accent-blue",
}: CompletionCriteriaProps) {
  if (criteria.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative -my-2 inline-flex min-h-10 items-center gap-1.5 py-2 text-[13px] font-medium hover:underline"
          style={{ color: `hsl(var(${accent}))` }}
        >
          <Info className="h-3.5 w-3.5" />
          {triggerLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">
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
      </PopoverContent>
    </Popover>
  );
}

export default CompletionCriteria;
