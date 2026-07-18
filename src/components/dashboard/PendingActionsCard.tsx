import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, ClipboardList, FileCheck, Flag } from "lucide-react";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { DashboardAppraisalCard } from "@/components/appraisals/DashboardAppraisalCard";

interface PendingActionsCardProps {
  isHr: boolean;
  activeCycle: AppraisalCycle | null;
  participants: CycleParticipant[];
}

type ActionRow = {
  icon: typeof Flag;
  accent: string;
  title: string;
  meta: string;
  href: string;
};

function buildHrActions(cycle: AppraisalCycle, participants: CycleParticipant[]): ActionRow[] {
  const rows: ActionRow[] = [];
  const now = Date.now();
  const finalEnd = new Date(cycle.final_window_end).getTime();
  const daysToFinal = Math.ceil((finalEnd - now) / 86400000);

  const awaitingInterim = participants.filter((p) => !p.interim_submitted_at);
  const awaitingFinal = participants.filter(
    (p) => p.interim_submitted_at && !p.final_submitted_at,
  );
  const awaitingAck = participants.filter(
    (p) => p.final_submitted_at && !p.acknowledged_at,
  );

  if (awaitingInterim.length > 0) {
    rows.push({
      icon: ClipboardList,
      accent: "--accent-blue",
      title: `${awaitingInterim.length} interim assessment${awaitingInterim.length > 1 ? "s" : ""} pending`,
      meta: `Cycle · ${cycle.name}`,
      href: `/appraisals/${cycle.id}`,
    });
  }
  if (awaitingFinal.length > 0) {
    rows.push({
      icon: FileCheck,
      accent: "--accent-yellow",
      title: `${awaitingFinal.length} final review${awaitingFinal.length > 1 ? "s" : ""} to submit`,
      meta: daysToFinal >= 0 ? `Due in ${daysToFinal} day${daysToFinal === 1 ? "" : "s"}` : "Overdue",
      href: `/appraisals/${cycle.id}`,
    });
  }
  if (awaitingAck.length > 0) {
    rows.push({
      icon: Flag,
      accent: "--accent-green",
      title: `${awaitingAck.length} awaiting employee sign-off`,
      meta: `Cycle · ${cycle.name}`,
      href: `/appraisals/${cycle.id}`,
    });
  }

  return rows;
}

export function PendingActionsCard({ isHr, activeCycle, participants }: PendingActionsCardProps) {
  if (!isHr) {
    // Employee / manager view: fall back to the existing personal appraisal tracker.
    return <DashboardAppraisalCard />;
  }

  const actions = activeCycle ? buildHrActions(activeCycle, participants) : [];

  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-[hsl(var(--hairline))] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Pending actions</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-subtle))]">
            {activeCycle ? activeCycle.name : "No active cycle"}
          </p>
        </div>
        {activeCycle && (
          <Link
            to={`/appraisals/${activeCycle.id}`}
            className="text-xs font-medium text-[hsl(var(--accent-blue))] hover:underline"
          >
            View cycle
          </Link>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent-green)/0.14)]">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-green))]" />
          </span>
          <p className="text-sm font-medium text-foreground">You're all caught up</p>
          <p className="text-xs text-[hsl(var(--ink-subtle))] text-pretty max-w-xs">
            {activeCycle
              ? "No pending assessments in the active cycle."
              : "Launch a cycle to start tracking assessments here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[hsl(var(--hairline))]">
          {actions.map((a, i) => {
            const Icon = a.icon;
            return (
              <li key={i}>
                <Link
                  to={a.href}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[hsl(var(--ink-strong)/0.03)]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `hsl(var(${a.accent}) / 0.12)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `hsl(var(${a.accent}))` }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[hsl(var(--ink-subtle))]">{a.meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[hsl(var(--ink-subtle))] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PendingActionsCard;
