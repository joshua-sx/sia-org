import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  CalendarClock,
  Minus,
  Users,
  Building2,
  UserCog,
  ShieldCheck,
  Check,
  Globe2,
  Briefcase,
} from "lucide-react";
import { useOnboarding, type OnboardingStatus, type OnboardingStepKey } from "@/hooks/useOnboarding";
import { useEmployees } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";

const STATUS_LABEL: Record<OnboardingStatus, string> = {
  done: "Complete",
  current: "In progress",
  next: "Not started",
  skipped: "Skipped",
  locked: "Locked",
};

type LaunchCopy = {
  headline: string;
  subhead: string;
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
};

const LAUNCH_COPY: Record<OnboardingStepKey, LaunchCopy> = {
  account: {
    headline: "Finish setting up your account",
    subhead: "Confirm your profile so we can personalize your workspace.",
    ctaTitle: "Complete your account",
    ctaBody: "Add your details to unlock the rest of the setup flow.",
    ctaLabel: "Continue setup",
  },
  structure: {
    headline: "Shape your organization",
    subhead:
      "Define the levels of your organization — divisions, departments, teams — so reviews reflect how your company actually works.",
    ctaTitle: "Set up your organization structure",
    ctaBody:
      "Pick a template or design your own levels, then add the first units. You can always expand it later.",
    ctaLabel: "Set up structure",
  },
  people: {
    headline: "Add your team to keep things moving",
    subhead:
      "Bring in the people who will take part in appraisal cycles. Import a CSV or add them one at a time.",
    ctaTitle: "Add your employees",
    ctaBody:
      "Give each person a role and a manager so review workflows can route automatically.",
    ctaLabel: "Add employees",
  },
  cycle: {
    headline: "You're one step away from launching reviews",
    subhead:
      "Your organization profile, structure, and employee data are ready. Create your first appraisal cycle to define how reviews will run.",
    ctaTitle: "Create your first appraisal cycle",
    ctaBody:
      "Choose the review timeline, participants, managers, rating scale, forms, and launch settings. You'll review everything before invitations are sent.",
    ctaLabel: "Create First Appraisal Cycle",
  },
};

const CYCLE_SUBSTEPS = [
  "Review type and timeline",
  "Participants and managers",
  "Rating scale and forms",
  "Review settings",
  "Final launch confirmation",
];

const STEP_ICON: Record<OnboardingStepKey, typeof CalendarClock> = {
  account: CheckCircle2,
  structure: Building2,
  people: Users,
  cycle: CalendarClock,
};

const Dashboard = () => {
  const { profile, organization } = useAuth();
  const { steps, completedCount, totalSteps, resume, setupComplete } = useOnboarding();

  if (!setupComplete) {
    return <LaunchOnboardingView />;
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const progressPct = 100;

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-blue))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-blue))]" />
            Overview
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            You're all set. Ready to run your first appraisal cycle.
          </p>
          <div className="mt-3 w-56 h-1 rounded-full bg-[hsl(var(--ink-strong)/0.06)] overflow-hidden">
            <div className="h-full bg-[hsl(var(--accent-green))]" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {organization && (
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-w-[220px]">
            <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Organization</p>
            <p className="mt-0.5 text-sm font-medium text-foreground truncate">{organization.name}</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--hairline))]">
          <h2 className="text-sm font-semibold text-foreground">Setup checklist</h2>
          <span className="text-xs text-[hsl(var(--ink-muted))] tabular-nums">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {steps.map((item) => {
            const Icon = item.icon;
            const showResume = (item.status === "current" || item.status === "skipped") && item.href;
            return (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `hsl(var(${item.accent}) / 0.1)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: `hsl(var(${item.accent}))` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${item.done ? "text-[hsl(var(--ink-subtle))] line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  <span className="ml-2 text-[11px] text-[hsl(var(--ink-subtle))] capitalize">
                    · {STATUS_LABEL[item.status]}
                  </span>
                </div>
                {item.done ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-[hsl(var(--accent-green))]" />
                ) : item.skipped ? (
                  <button
                    onClick={() => resume(item.key)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[hsl(45,70%,32%)] bg-[hsl(var(--accent-yellow)/0.14)] hover:bg-[hsl(var(--accent-yellow)/0.22)] active:scale-[0.96]"
                    style={{ transitionProperty: "background-color, transform", transitionDuration: "150ms" }}
                  >
                    <Minus className="h-3 w-3" /> Resume
                  </button>
                ) : showResume ? (
                  <Link to={item.href!}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                      Continue
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : (
                  <Circle className="h-[18px] w-[18px] text-[hsl(var(--ink-subtle))]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function LaunchOnboardingView() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { steps } = useOnboarding();
  const employees = useEmployees();
  const units = useOrgUnits();

  const current = steps.find((s) => s.status === "current") ?? steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const copy = LAUNCH_COPY[current.key];
  const CtaIcon = STEP_ICON[current.key];
  const doneSteps = steps.filter((s) => s.done);

  const employeeCount = employees.data?.length ?? 0;
  const unitCount = units.data?.length ?? 0;
  const managerCount = useMemo(() => {
    const ids = new Set((employees.data ?? []).map((e) => e.manager_id).filter(Boolean) as string[]);
    return ids.size;
  }, [employees.data]);

  const handleCta = () => {
    if (current.key === "cycle") {
      navigate("/appraisals");
      return;
    }
    if (current.href) navigate(current.href);
  };

  return (
    <>
      <PageHead
        title="Dashboard | SIA"
        description="Track appraisal setup progress and manage your SIA workspace."
        path="/dashboard"
      />
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* MAIN */}
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-blue))] uppercase tracking-wider">
            Setup
          </p>
          <h1 className="text-[40px] md:text-[52px] leading-[1.05] font-semibold tracking-[-1.5px] text-foreground font-[Space_Grotesk] text-balance">
            {copy.headline}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--ink-muted))] max-w-[560px]" style={{ textWrap: "pretty" as never }}>
            {copy.subhead}
          </p>

          {/* CTA card */}
          <div className="mt-8 rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-6 md:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col md:flex-row gap-5 md:gap-6 md:items-start">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "hsl(var(--accent-blue) / 0.1)" }}
              >
                <CtaIcon className="h-6 w-6" style={{ color: "hsl(var(--accent-blue))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground tracking-[-0.2px]">{copy.ctaTitle}</h2>
                <p className="mt-1.5 text-sm text-[hsl(var(--ink-muted))] leading-relaxed">{copy.ctaBody}</p>
                <Button
                  onClick={handleCta}
                  className="mt-5 h-11 px-6 text-sm font-medium active:scale-[0.98]"
                  style={{ transitionProperty: "background-color, transform", transitionDuration: "150ms" }}
                >
                  {copy.ctaLabel}
                </Button>
                <div className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--ink-subtle))]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>No employee invitations will be sent until you confirm launch.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completed recap */}
          {doneSteps.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-foreground">Setup completed</h3>
              <div className="mt-3 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-4 py-3 flex flex-wrap gap-2">
                {doneSteps.map((s) => (
                  <span
                    key={s.key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent-green)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--accent-green))]"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ASIDE */}
        <aside className="flex flex-col gap-4">
          {current.key === "cycle" && (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <h3 className="text-sm font-semibold text-foreground">What you'll configure</h3>
              <ol className="mt-4 space-y-3">
                {CYCLE_SUBSTEPS.map((label, i) => (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums"
                      style={{
                        borderColor: "hsl(var(--accent-blue) / 0.35)",
                        color: "hsl(var(--accent-blue))",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-foreground">Workspace summary</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <SummaryStat icon={Users} value={employeeCount} label="Employees imported" />
              <SummaryStat icon={Building2} value={unitCount} label="Units created" />
              <SummaryStat icon={UserCog} value={managerCount} label="Managers assigned" />
            </div>
          </div>

          {organization && (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Organization</p>
              <p className="mt-1 text-lg font-semibold text-foreground tracking-[-0.2px] truncate">
                {organization.name}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-[hsl(var(--ink-muted))]">
                {organization.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-[hsl(var(--ink-subtle))]" />
                    <span>
                      <span className="text-[hsl(var(--ink-subtle))]">Industry:</span>{" "}
                      <span className="text-foreground">{organization.industry}</span>
                    </span>
                  </div>
                )}
                {organization.country && (
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5 text-[hsl(var(--ink-subtle))]" />
                    <span>
                      <span className="text-[hsl(var(--ink-subtle))]">Region:</span>{" "}
                      <span className="text-foreground">{organization.country}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Icon className="h-4 w-4 text-[hsl(var(--accent-blue))]" />
      <span className="text-2xl font-semibold tabular-nums text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-[hsl(var(--ink-subtle))] leading-tight">{label}</span>
    </div>
  );
}

export default Dashboard;
