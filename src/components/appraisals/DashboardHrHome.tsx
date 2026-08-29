import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CycleStatusBadge } from "@/components/appraisals/CycleStatusBadge";
import { hrDashboardNextAction, type HrDashboardCycle } from "@/lib/hrDashboardNextAction";

export function DashboardHrHome({ cycles }: { cycles: readonly HrDashboardCycle[] }) {
  const next = hrDashboardNextAction(cycles);

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-hairline bg-surface-raised shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-green/[0.12]">
            <CalendarClock className="h-5 w-5 text-accent-green" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground font-[Space_Grotesk]">
                {next.title}
              </h2>
              {next.cycleStatus && <CycleStatusBadge status={next.cycleStatus} />}
            </div>
            <p className="mt-1 text-sm text-ink-muted text-pretty">{next.description}</p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link to={next.href}>
            {next.ctaLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default DashboardHrHome;
