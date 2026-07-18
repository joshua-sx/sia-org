import { Link } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface CycleRowExtras {
  participants: number;
  submitted: number;
  ownerName?: string | null;
}

interface ActiveCyclesTableProps {
  cycles: AppraisalCycle[];
  extras: Record<string, CycleRowExtras>;
}

function initials(name?: string | null) {
  if (!name) return "—";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActiveCyclesTable({ cycles, extras }: ActiveCyclesTableProps) {
  const rows = cycles.slice(0, 5);

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-[hsl(var(--hairline))] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Cycles</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-subtle))]">Track progress across every review</p>
        </div>
        <Link
          to="/appraisals"
          className="text-xs font-medium text-[hsl(var(--accent-blue))] hover:underline"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--accent-blue)/0.12)]">
            <CalendarPlus className="h-5 w-5 text-[hsl(var(--accent-blue))]" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No cycles yet</p>
            <p className="mt-0.5 text-xs text-[hsl(var(--ink-subtle))]">
              Create your first appraisal cycle to see it here.
            </p>
          </div>
          <Link to="/appraisals">
            <Button
              size="sm"
              className="rounded-full bg-[hsl(var(--accent-blue))] text-white hover:bg-[hsl(var(--accent-blue)/0.9)] active:scale-[0.96]"
              style={{ transitionProperty: "background-color, transform", transitionDuration: "150ms" }}
            >
              Create cycle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium">Progress</th>
                <th className="px-2 py-3 font-medium">Participants</th>
                <th className="px-2 py-3 font-medium">Final due</th>
                <th className="px-5 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--hairline))]">
              {rows.map((c) => {
                const e = extras[c.id] ?? { participants: 0, submitted: 0 };
                const total = e.participants * 3 || 1;
                const pct = Math.round((e.submitted / total) * 100);
                return (
                  <tr
                    key={c.id}
                    className="group transition-colors hover:bg-[hsl(var(--ink-strong)/0.03)]"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/appraisals/${c.id}`}
                        className="font-medium text-foreground hover:text-[hsl(var(--accent-blue))]"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3.5">
                      <CycleStatusBadge status={c.status} />
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="h-1.5 flex-1 rounded-full bg-[hsl(var(--hairline))] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: "hsl(var(--accent-blue))",
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-[hsl(var(--ink-muted))] w-9 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 tabular-nums text-[hsl(var(--ink-muted))]">
                      {e.participants}
                    </td>
                    <td className="px-2 py-3.5 tabular-nums text-[hsl(var(--ink-muted))]">
                      {formatDate(c.final_window_end)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-[hsl(var(--accent-blue)/0.12)] text-[hsl(var(--accent-blue))] text-[10px] font-medium">
                            {initials(e.ownerName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-[hsl(var(--ink-muted))] truncate max-w-[120px]">
                          {e.ownerName ?? "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ActiveCyclesTable;
