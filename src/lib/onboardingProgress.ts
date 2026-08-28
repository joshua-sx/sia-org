export type SegmentState = "done" | "current" | "upcoming";

/** Shared color rule for every setup progress indicator. */
export function stepSegmentColor(opts: { accent: string; state: SegmentState | "skipped" }) {
  if (opts.state === "current") return `hsl(var(${opts.accent}))`;
  if (opts.state === "done") return "hsl(var(--foreground))";
  return "hsl(var(--hairline))";
}
