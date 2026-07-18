import { useMemo } from "react";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";

interface CompletionChartProps {
  participants: CycleParticipant[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * 7-bar weekly completion chart. Buckets participant submission timestamps
 * (interim/final/acknowledge) by weekday over the last 7 days. Fully
 * client-side — no new query wiring needed.
 */
export function CompletionChart({ participants }: CompletionChartProps) {
  const { bars, overall, delta } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const counts = Array<number>(7).fill(0);
    for (const p of participants) {
      const stamps = [p.interim_submitted_at, p.final_submitted_at, p.acknowledged_at].filter(
        Boolean,
      ) as string[];
      for (const s of stamps) {
        const d = new Date(s);
        if (d < startOfWeek) continue;
        const diff = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
        if (diff >= 0 && diff < 7) counts[diff] += 1;
      }
    }

    const totalStages = participants.length * 3 || 1;
    const submitted = participants.reduce(
      (acc, p) =>
        acc +
        (p.interim_submitted_at ? 1 : 0) +
        (p.final_submitted_at ? 1 : 0) +
        (p.acknowledged_at ? 1 : 0),
      0,
    );
    const overall = Math.round((submitted / totalStages) * 100);

    // rough delta: this-week vs last-week sums
    const thisWeek = counts.reduce((a, b) => a + b, 0);
    const prevStart = new Date(startOfWeek);
    prevStart.setDate(prevStart.getDate() - 7);
    let prev = 0;
    for (const p of participants) {
      const stamps = [p.interim_submitted_at, p.final_submitted_at, p.acknowledged_at].filter(
        Boolean,
      ) as string[];
      for (const s of stamps) {
        const d = new Date(s);
        if (d >= prevStart && d < startOfWeek) prev += 1;
      }
    }
    const delta = prev === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - prev) / prev) * 100);

    const max = Math.max(...counts, 1);
    const bars = counts.map((c, i) => ({
      label: DAY_LABELS[i],
      value: c,
      height: Math.max(6, Math.round((c / max) * 100)),
    }));

    return { bars, overall, delta };
  }, [participants]);

  const positive = delta >= 0;

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Cycle completion</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-subtle))]">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums font-[Space_Grotesk] text-foreground">
            {overall}%
          </p>
          <p
            className="mt-0.5 text-[11px] font-medium tabular-nums"
            style={{ color: `hsl(var(${positive ? "--accent-green" : "--accent-red"}))` }}
          >
            {positive ? "+" : ""}
            {delta}% vs last week
          </p>
        </div>
      </div>

      <div className="mt-5 flex h-28 items-end gap-2">
        {bars.map((b, i) => {
          const isToday = i === bars.length - 1;
          return (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-md transition-[height] duration-500 motion-reduce:transition-none"
                style={{
                  height: `${b.height}%`,
                  backgroundColor: `hsl(var(--accent-blue) / ${isToday ? 0.9 : 0.35})`,
                }}
                aria-label={`${b.label}: ${b.value} submissions`}
              />
              <span className="text-[10px] text-[hsl(var(--ink-subtle))]">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CompletionChart;
