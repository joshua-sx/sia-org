import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Rocket,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { useAppraisalCycles, type AppraisalCycle } from "@/hooks/useAppraisalCycles";
import { useCycleAudit, type AuditEvent } from "@/hooks/useCycleAudit";
import { useCycleParticipants, type CycleParticipant } from "@/hooks/useCycleParticipants";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { actionLabel } from "@/lib/auditLog";
import {
  buildBriefingAttention,
  buildBriefingPhases,
  getBriefingDeadline,
  getBriefingStage,
  selectBriefingCycle,
  type BriefingAttentionItem,
} from "@/lib/dashboardBriefing";
import { formatDate } from "@/lib/cycleSchema";
import { cn } from "@/lib/utils";

const shortDate = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function relativeTime(iso: string) {
  const deltaMinutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(deltaMinutes) < 60) return formatter.format(deltaMinutes, "minute");
  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) return formatter.format(deltaHours, "hour");
  return formatter.format(Math.round(deltaHours / 24), "day");
}

function activityIcon(event: AuditEvent) {
  if (event.action.startsWith("participant.")) return UserRoundCheck;
  if (event.action.startsWith("cycle.")) return CalendarRange;
  if (event.action.startsWith("assessment.") || event.action.startsWith("review.")) {
    return ClipboardCheck;
  }
  if (event.action.startsWith("goal.")) return CheckCircle2;
  return Building2;
}

function activityAccent(event: AuditEvent) {
  if (event.action.startsWith("participant.")) return "--accent-purple";
  if (event.action === "cycle.launched" || event.action === "cycle.closed") return "--accent-green";
  if (event.action.startsWith("cycle.")) return "--accent-red";
  return "--accent-blue";
}

function phaseStatusLabel(state: "done" | "current" | "upcoming") {
  if (state === "done") return "Complete";
  if (state === "current") return "Current phase";
  return "Upcoming";
}

function AttentionIcon({ tone }: { tone: BriefingAttentionItem["tone"] }) {
  const Icon = tone === "success" ? Check : tone === "info" ? UsersRound : CircleAlert;
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        tone === "warning" && "bg-accent-yellow/[0.13] text-accent-yellow-ink",
        tone === "info" && "bg-accent-blue/10 text-accent-blue",
        tone === "success" && "bg-accent-green/10 text-accent-green",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export interface OperationalBriefingPreviewData {
  cycles: AppraisalCycle[];
  employees: Employee[];
  participants: CycleParticipant[];
  events: AuditEvent[];
}

export function OperationalBriefing({ previewData }: { previewData?: OperationalBriefingPreviewData }) {
  const cyclesQuery = useAppraisalCycles();
  const employeesQuery = useEmployees();
  const cycle = selectBriefingCycle(previewData?.cycles ?? cyclesQuery.data ?? []);
  const participantsQuery = useCycleParticipants(cycle?.status !== "draft" ? cycle?.id : undefined);
  const auditQuery = useCycleAudit(cycle?.id, !!cycle);

  const needsParticipants = cycle?.status === "active" || cycle?.status === "completed";
  const isLoading = !previewData && (
    cyclesQuery.isLoading ||
    employeesQuery.isLoading ||
    (needsParticipants && participantsQuery.isLoading)
  );
  const isError = !previewData && (
    cyclesQuery.isError ||
    employeesQuery.isError ||
    (needsParticipants && participantsQuery.isError)
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-6 py-10 lg:px-12">
        <QueryLoading label="Loading your operational briefing" rows={7} />
      </div>
    );
  }

  if (isError) {
    const error = cyclesQuery.error ?? employeesQuery.error ?? participantsQuery.error;
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-12">
        <QueryError
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => {
            void cyclesQuery.refetch();
            void employeesQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-12">
        <p className="text-sm text-ink-muted">{shortDate.format(new Date())}</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-1.25px]">
          Operational Briefing
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-6 text-ink-muted">
          Your people are ready. Create the first appraisal cycle to begin tracking progress and attention.
        </p>
        <div className="mt-10 rounded-2xl border border-accent-blue/[0.18] bg-surface-raised px-6 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-8">
          <CalendarDays className="h-6 w-6 text-accent-blue" />
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.35px]">Create your first appraisal cycle</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">
            Define the review windows, confirm participants, and launch only when every required check is complete.
          </p>
          <Button asChild className="mt-6 h-11 px-5">
            <Link to="/appraisals">Create cycle <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const participants = previewData?.participants ?? participantsQuery.data ?? [];
  const phases = buildBriefingPhases(cycle);
  const deadline = getBriefingDeadline(cycle);
  const attention = buildBriefingAttention(cycle, previewData?.employees ?? employeesQuery.data ?? [], participants);
  const blockerCount = attention.filter((item) => item.tone === "warning" && item.count > 0).length;
  const events = (previewData?.events ?? auditQuery.data ?? []).slice(0, 5);
  const primaryLabel = cycle.status === "draft"
    ? blockerCount > 0
      ? `Resolve ${blockerCount} ${blockerCount === 1 ? "blocker" : "blockers"}`
      : "Review launch readiness"
    : blockerCount > 0
      ? `Resolve ${blockerCount} ${blockerCount === 1 ? "blocker" : "blockers"}`
      : "Review cycle";

  return (
    <div className="mx-auto grid w-full max-w-[1280px] xl:grid-cols-[minmax(0,1fr)_332px]">
      <div className="min-w-0 px-6 py-10 md:px-10 md:py-12 xl:px-14">
        <header>
          <p className="text-[13px] text-ink-muted">{shortDate.format(new Date())}</p>
          <h1 className="mt-5 text-[clamp(2.25rem,4vw,2.75rem)] font-semibold leading-[1.04] tracking-[-1.5px] text-foreground">
            Operational Briefing
          </h1>
          <p className="mt-3 max-w-[540px] text-[15px] leading-6 text-ink-muted">
            Your appraisal operations at a glance. Focus on what needs attention and take the next safe action.
          </p>
        </header>

        <section className="mt-8 border-t border-hairline pt-7" aria-labelledby="active-cycle-heading">
          <p className="text-sm font-medium text-foreground">{cycle.status === "completed" ? "Latest cycle" : "Current cycle"}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="active-cycle-heading" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-1px]">
                {cycle.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-accent-blue">
                  <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                  {cycle.status === "draft" ? "Draft" : cycle.status === "active" ? "In progress" : "Completed"}
                </span>
                <span className="text-ink-muted">{getBriefingStage(cycle)}</span>
              </div>
            </div>
          </div>

          <ol className="mt-9 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4" aria-label="Appraisal cycle phases">
            {phases.map((phase, index) => (
              <li key={phase.id} className="relative min-w-0">
                {index < phases.length - 1 && (
                  <span className="absolute start-7 end-[-18px] top-3.5 hidden h-px bg-hairline md:block" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-surface",
                    phase.state === "done" && "border-accent-blue bg-accent-blue text-white",
                    phase.state === "current" && "border-accent-blue text-accent-blue ring-4 ring-accent-blue/[0.12]",
                    phase.state === "upcoming" && "border-hairline text-ink-subtle",
                  )}
                  aria-hidden="true"
                >
                  {phase.state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </span>
                <p className="mt-4 text-[13px] font-medium text-foreground">{phase.label}<span className="sr-only">: {phaseStatusLabel(phase.state)}</span></p>
                <p className="mt-1 text-[12px] leading-5 text-ink-subtle">{phase.dates}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-5 border-b border-hairline pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
                {cycle.status === "draft" ? <Rocket className="h-[18px] w-[18px]" /> : <CalendarDays className="h-[18px] w-[18px]" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">{cycle.status === "draft" ? "Next safe action" : "Next deadline"}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {cycle.status === "draft"
                    ? blockerCount > 0
                      ? "Resolve launch blockers"
                      : "Review and launch this cycle"
                    : deadline
                      ? `${deadline.label}${deadline.daysAway > 0 ? ` in ${deadline.daysAway} days` : " today"}`
                      : "Review the completed cycle"}
                </p>
                {deadline && cycle.status !== "draft" && (
                  <p className="mt-0.5 text-xs text-ink-subtle">{formatDate(deadline.date)}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button asChild className="h-11 px-5 shadow-sm">
                <Link to={`/appraisals/${cycle.id}`}>{primaryLabel}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-5 bg-transparent">
                <Link to={`/appraisals/${cycle.id}`}>View cycle</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4" aria-labelledby="attention-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="attention-heading" className="text-base font-semibold tracking-[-0.2px]">Attention</h2>
              <p className="mt-1 text-sm text-ink-muted">Resolve what matters most to keep the cycle on track.</p>
            </div>
            <Link to={`/appraisals/${cycle.id}`} className="hidden items-center gap-1.5 rounded-md text-sm font-medium text-accent-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:inline-flex">
              View all <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="group flex items-center gap-4 rounded-lg py-4 transition-[background-color,box-shadow] hover:bg-ink-strong/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <AttentionIcon tone={item.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">{item.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-lg font-medium tabular-nums",
                      item.tone === "warning" && "text-accent-yellow-ink",
                      item.tone === "info" && "text-accent-blue",
                      item.tone === "success" && "text-accent-green",
                    )}
                  >
                    {item.count}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="border-t border-hairline px-6 py-10 xl:border-s xl:border-t-0 xl:px-8 xl:py-14" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-base font-semibold tracking-[-0.2px]">Recent activity</h2>
        {!previewData && auditQuery.isLoading ? (
          <QueryLoading className="mt-6" label="Loading recent activity" rows={4} />
        ) : !previewData && auditQuery.isError ? (
          <QueryError
            className="mt-6 px-4 py-6"
            message={auditQuery.error instanceof Error ? auditQuery.error.message : undefined}
            onRetry={() => void auditQuery.refetch()}
          />
        ) : events.length === 0 ? (
          <div className="mt-6 border-y border-hairline py-8">
            <CalendarRange className="h-5 w-5 text-accent-green" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-foreground">No cycle activity yet</p>
            <p className="mt-1 text-[13px] leading-5 text-ink-muted">
              Changes, submissions, and milestones will appear here.
            </p>
          </div>
        ) : (
          <ol className="mt-8 space-y-7">
            {events.map((event) => {
              const Icon = activityIcon(event);
              const accent = activityAccent(event);
              return (
                <li key={event.id} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `hsl(var(${accent}) / 0.1)`, color: `hsl(var(${accent}))` }}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium leading-5 text-foreground">{actionLabel(event.action)}</p>
                      <time className="shrink-0 text-[11px] leading-5 text-ink-subtle" dateTime={event.created_at}>
                        {relativeTime(event.created_at)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-5 text-ink-muted line-clamp-2">
                      {event.summary ?? event.actor_email ?? "System update"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <Link to={`/appraisals/${cycle.id}`} className="mt-8 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-accent-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          View all activity <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
