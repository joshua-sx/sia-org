import { formatDate, formatWindow, windowState } from "@/lib/cycleSchema";

export function CycleWindowsSummary({
  cycle,
}: {
  cycle: {
    goal_window_start: string;
    goal_window_end: string;
    interim_window_start: string;
    interim_window_end: string;
    final_window_start: string;
    final_window_end: string;
    acknowledgement_due: string;
  };
}) {
  const windows = [
    { label: "Goal setting", start: cycle.goal_window_start, end: cycle.goal_window_end },
    { label: "Interim assessment", start: cycle.interim_window_start, end: cycle.interim_window_end },
    { label: "Final assessment", start: cycle.final_window_start, end: cycle.final_window_end },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {windows.map((w) => {
        const state = windowState(w.start, w.end);
        return (
          <div
            key={w.label}
            className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4"
          >
            <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">{w.label}</p>
            <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
              {formatWindow(w.start, w.end)}
            </p>
            <p
              className="mt-1 text-[11px] font-medium"
              style={{
                color:
                  state === "open"
                    ? "hsl(var(--accent-green))"
                    : state === "upcoming"
                      ? "hsl(var(--accent-blue))"
                      : "hsl(var(--ink-subtle))",
              }}
            >
              {state === "open" ? "Open now" : state === "upcoming" ? "Upcoming" : "Closed"}
            </p>
          </div>
        );
      })}
      <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4">
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Acknowledgement due</p>
        <p className="mt-1 text-sm font-medium text-foreground tabular-nums">{cycle.acknowledgement_due}</p>
      </div>
    </div>
  );
}
