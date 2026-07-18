import { ArrowDown, ArrowUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number | null;
  deltaLabel?: string;
  accent?: "blue" | "green" | "red" | "purple";
  icon?: LucideIcon;
}

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue: "--accent-blue",
  green: "--accent-green",
  red: "--accent-red",
  purple: "--accent-yellow", // token was remapped to purple project-wide
};

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last cycle",
  accent = "blue",
  icon: Icon,
}: StatCardProps) {
  const token = ACCENT[accent];
  const hasDelta = typeof delta === "number";
  const positive = hasDelta && delta! >= 0;
  const deltaColor = positive ? "--accent-green" : "--accent-red";

  return (
    <div className="group relative rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-[hsl(var(--ink-strong)/0.14)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
          {label}
        </p>
        {Icon && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `hsl(var(${token}) / 0.12)` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: `hsl(var(${token}))` }} />
          </span>
        )}
      </div>
      <p className="mt-3 text-[32px] leading-none font-semibold tracking-[-1px] tabular-nums font-[Space_Grotesk] text-foreground">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[hsl(var(--ink-subtle))] tabular-nums">
        {hasDelta ? (
          <>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium"
              style={{
                backgroundColor: `hsl(var(${deltaColor}) / 0.12)`,
                color: `hsl(var(${deltaColor}))`,
              }}
            >
              {positive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {Math.abs(delta!)}
            </span>
            <span>{deltaLabel}</span>
          </>
        ) : (
          <span className="text-[hsl(var(--ink-subtle))]">—</span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
