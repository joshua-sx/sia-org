import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, Circle, ChevronRight, Minus } from "lucide-react";
import { useOnboarding, type OnboardingStatus } from "@/hooks/useOnboarding";
import { DashboardAppraisalCard } from "@/components/appraisals/DashboardAppraisalCard";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { useEmployees } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { SetupDashboard } from "@/pages/SetupDashboard";

const STATUS_LABEL: Record<OnboardingStatus, string> = {
  done: "Complete",
  current: "In progress",
  next: "Not started",
  skipped: "Skipped",
  locked: "Locked",
};

const Dashboard = () => {
  const { profile, organization } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { steps, completedCount, totalSteps, resume, setupComplete } = useOnboarding();
  const { data: employees = [] } = useEmployees();
  const { data: units = [] } = useOrgUnits();
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const justCompleted =
    (location.state as { setupJustCompleted?: boolean } | null)?.setupJustCompleted === true;

  if (!setupComplete) {
    return <SetupDashboard />;
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const remaining = steps.filter((s) => !s.done);

  if (justCompleted && !celebrationDismissed) {
    return (
      <StepSuccess
        eyebrow="SETUP COMPLETE"
        title={`You're set up${firstName ? `, ${firstName}` : ""}`}
        description={
          remaining.length === 0
            ? "Your organization, people, and first appraisal cycle are ready. Everything from here happens inside the cycle."
            : "The essentials are in place. You skipped a few optional steps — you can pick them up from the dashboard checklist whenever you're ready."
        }
        stats={[
          { value: units.length, label: "Units" },
          { value: employees.length, label: "People" },
          { value: `${completedCount}/${totalSteps}`, label: "Steps done" },
        ]}
        primaryLabel="Go to dashboard"
        onPrimary={() => {
          setCelebrationDismissed(true);
          navigate("/dashboard", { replace: true, state: null });
        }}
        secondaryLabel="Open appraisals"
        onSecondary={() => navigate("/appraisals")}
      />
    );
  }

  const subtitle =
    remaining.length === 0
      ? "You're all set. Ready to run your first appraisal cycle."
      : `Setup is done. ${remaining.length} optional ${remaining.length === 1 ? "step is" : "steps are"} still open below.`;

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
      <PageHeader
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        subtitle={subtitle}
        actions={
          organization && (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-w-[220px]">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Organization</p>
              <p className="mt-0.5 text-sm font-medium text-foreground truncate">{organization.name}</p>
            </div>
          )
        }
      />

      <DashboardAppraisalCard className="mt-8" />


      <div className="mt-8 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--hairline))]">
          <h2 className="text-sm font-semibold text-foreground">Setup checklist</h2>
          <span className="inline-flex items-center rounded-full bg-[hsl(var(--accent-green)/0.12)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--accent-green))] tabular-nums">
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
                  <span className={`text-sm ${item.done ? "text-[hsl(var(--ink-muted))]" : "font-medium text-foreground"}`}>
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
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[hsl(45,55%,32%)] bg-[hsl(var(--accent-yellow)/0.14)] hover:bg-[hsl(var(--accent-yellow)/0.22)] active:scale-[0.96]"
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

export default Dashboard;
