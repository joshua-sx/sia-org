import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { formatDate, formatWindow } from "@/lib/cycleSchema";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";

export function AppraisalCycleList({ cycles }: { cycles: AppraisalCycle[] }) {
  return (
    <div className="divide-y divide-hairline overflow-hidden rounded-2xl bg-surface-raised shadow-[var(--shadow-border)]">
      {cycles.map((cycle) => (
        <Link
          key={cycle.id}
          to={`/appraisals/${cycle.id}`}
          className="group block p-5 transition-[background-color,box-shadow] duration-150 hover:bg-ink-strong/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-green/10 text-accent-green">
              <CalendarClock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-base font-semibold tracking-[-0.2px] text-foreground">{cycle.name}</h2>
                <CycleStatusBadge status={cycle.status} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Acknowledge by {formatDate(cycle.acknowledgement_due)}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-[background-color,color,transform] duration-150 group-hover:translate-x-0.5 group-hover:bg-accent-green/10 group-hover:text-accent-green rtl:group-hover:-translate-x-0.5">
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-4 ps-14 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Goal setting</dt>
              <dd className="mt-1 text-xs text-ink-muted">{formatWindow(cycle.goal_window_start, cycle.goal_window_end)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Interim review</dt>
              <dd className="mt-1 text-xs text-ink-muted">{formatWindow(cycle.interim_window_start, cycle.interim_window_end)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Final review</dt>
              <dd className="mt-1 text-xs text-ink-muted">{formatWindow(cycle.final_window_start, cycle.final_window_end)}</dd>
            </div>
          </dl>
        </Link>
      ))}
    </div>
  );
}
