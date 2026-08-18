import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LAUNCH_COPY } from "@/content/onboardingCopy";
import { OnboardingStepFrame, FLOW_STEPS } from "@/components/onboarding/OnboardingStepFrame";
import { OnboardingPipeline } from "@/components/onboarding/OnboardingPipeline";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";

export function SetupDashboard() {
  const navigate = useNavigate();
  const { steps, finishSetup, saving } = useOnboarding();
  const { data: units = [] } = useOrgUnits();
  const { data: employees = [] } = useEmployees();
  const { data: cycles = [] } = useAppraisalCycles();
  const [confirmed, setConfirmed] = useState(false);

  const flowKeys = FLOW_STEPS.filter((s) => s.key !== "account").map((s) => s.key);
  const flowSteps = steps.filter((s) => flowKeys.includes(s.key));
  const allResolved = flowSteps.every((s) => s.done || s.skipped);

  const current =
    steps.find((s) => s.status === "current") ?? steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const copy = LAUNCH_COPY[current.key];

  const remaining = steps.filter((s) => !s.done && !s.skipped).length;
  const statusLabel = remaining <= 1 ? "Almost ready" : `${remaining} steps left`;
  const doneCount = steps.filter((s) => s.done).length;


  const handleCta = () => {
    if (current.href) navigate(current.href);
  };

  const head = (
    <PageHead
      title="Dashboard | SIA"
      description="Track appraisal setup progress and manage your SIA workspace."
      path="/dashboard"
    />
  );

  if (allResolved) {
    const activeCycle = cycles[0];
    const rows = [
      {
        label: "Organization",
        detail: `${units.length} ${units.length === 1 ? "unit" : "units"}`,
        href: "/org/structure",
      },
      {
        label: "People",
        detail: `${employees.length} ${employees.length === 1 ? "person" : "people"} assigned`,
        href: "/org/employees",
      },
      {
        label: "Cycle",
        detail: activeCycle ? activeCycle.name : "No cycle created",
        href: "/appraisals",
      },
    ];

    return (
      <>
        {head}
        <OnboardingStepFrame
          stepKey="review"
          eyebrow="Review & launch"
          title="Review and launch"
          subtitle="Confirm the setup before invitations are sent."
          continueLabel="Finish setup"
          continueDisabled={!confirmed}
          caption="You can keep editing any section after setup."
          secondary={
            <Link
              to="/appraisals"
              className="rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--accent-blue))] transition-colors hover:text-[hsl(var(--accent-blue))]/80"
            >
              Go to cycles
            </Link>
          }
        >
          <div className="rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)] divide-y divide-[hsl(var(--hairline))]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-4 px-5 py-4">
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "hsl(var(--accent-green))" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{row.label}</p>
                  <p className="mt-0.5 text-sm text-[hsl(var(--ink-muted))] truncate">{row.detail}</p>
                </div>
                <Link
                  to={row.href}
                  className="rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--accent-blue))] hover:text-[hsl(var(--accent-blue))]/80"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>

          <div
            className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-[hsl(var(--ink-muted))]"
            style={{ backgroundColor: "hsl(var(--accent-blue) / 0.07)" }}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--accent-blue))" }} />
            <span className="text-pretty">
              Invitations are only sent when you launch a cycle — finishing setup sends nothing.
            </span>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-foreground">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} />
            I've reviewed the setup and am ready to finish.
          </label>
        </OnboardingStepFrame>
      </>
    );
  }

  return (
    <>
      {head}
      <OnboardingStepFrame
        stepKey="account"
        eyebrow="Setup"
        title={copy.ctaTitle}
        subtitle={copy.ctaBody}
        statusLabel={statusLabel}
        statusMet={remaining <= 1}
        continueLabel={copy.ctaLabel}
        onContinue={handleCta}
        secondary={
          doneCount > 1 ? (
            <button
              onClick={() => finishSetup()}
              disabled={saving}
              className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--accent-blue))] transition-colors hover:text-[hsl(var(--accent-blue))]/80 disabled:opacity-60"
            >
              Review completed setup
            </button>
          ) : undefined
        }
      >
        <div className="rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)] divide-y divide-[hsl(var(--hairline))]">
          {steps
            .filter((s) => s.key !== "account")
            .map((s) => {
              const flow = FLOW_STEPS.find((f) => f.key === s.key);
              const isCurrent = s.key === current.key;
              return (
                <div key={s.key} className="flex items-center gap-4 px-5 py-4">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    style={{
                      color: s.done
                        ? "hsl(var(--accent-green))"
                        : isCurrent && flow
                        ? `hsl(var(${flow.accent}))`
                        : "hsl(var(--ink-subtle))",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="mt-0.5 truncate text-sm text-[hsl(var(--ink-muted))]">
                      {s.done ? "Complete" : s.skipped ? "Skipped" : isCurrent ? "Up next" : "Not started"}
                    </p>
                  </div>
                  {s.href && (
                    <Link
                      to={s.href}
                      className="rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--accent-blue))] hover:text-[hsl(var(--accent-blue))]/80"
                    >
                      {s.done ? "Edit" : "Open"}
                    </Link>
                  )}
                </div>
              );
            })}
        </div>
      </OnboardingStepFrame>
    </>
  );
}


export default SetupDashboard;
