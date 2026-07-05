import { CYCLE_STATUS_LABELS, type CycleStatus } from "@/lib/cycleSchema";

const STATUS_ACCENT: Record<CycleStatus, string> = {
  draft: "--accent-yellow",
  active: "--accent-green",
  completed: "--accent-blue",
};

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  const accent = STATUS_ACCENT[status] ?? "--accent-blue";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `hsl(var(${accent}) / 0.12)`,
        color: `hsl(var(${accent}))`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(var(${accent}))` }} />
      {CYCLE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
