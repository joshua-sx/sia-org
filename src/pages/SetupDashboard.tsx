import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, Building2, UserCog, ShieldCheck, Check, Globe2, Briefcase } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEmployees } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { LAUNCH_COPY, CYCLE_SUBSTEPS } from "@/content/onboardingCopy";
import { OnboardingPipeline } from "@/components/onboarding/OnboardingPipeline";

export function SetupDashboard() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { steps } = useOnboarding();
  const employees = useEmployees();
  const units = useOrgUnits();

  const current = steps.find((s) => s.status === "current") ?? steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const copy = LAUNCH_COPY[current.key];
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

          {/* CTA card — the focal element of this view */}
          <div className="mt-8 rounded-2xl border border-[hsl(var(--accent-blue)/0.18)] bg-[hsl(var(--surface-raised))] p-6 md:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-18px_rgba(0,0,0,0.16)] ring-1 ring-[hsl(var(--accent-blue)/0.05)]">
            {/* Signature: the setup pipeline being assembled */}
            <OnboardingPipeline steps={steps} currentKey={current.key} />

            <div className="mt-7 border-t border-[hsl(var(--hairline))] pt-6">
              <h2 className="text-xl font-semibold text-foreground tracking-[-0.3px]">{copy.ctaTitle}</h2>
              <p className="mt-2 text-sm text-[hsl(var(--ink-muted))] leading-relaxed max-w-[46ch]">{copy.ctaBody}</p>
              <Button
                onClick={handleCta}
                className="mt-6 h-12 px-7 text-[15px] font-medium active:scale-[0.98]"
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

        {/* ASIDE — supporting context, deliberately flat so the hero leads */}
        <aside className="flex flex-col gap-4">
          {current.key === "cycle" && (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5">
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

          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5">
            <h3 className="text-sm font-semibold text-foreground">Workspace summary</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <SummaryStat icon={Users} value={employeeCount} label="Employees imported" />
              <SummaryStat icon={Building2} value={unitCount} label="Units created" />
              <SummaryStat icon={UserCog} value={managerCount} label="Managers assigned" />
            </div>
          </div>

          {organization && (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Organization</p>
              <p className="mt-1 text-base font-semibold text-foreground tracking-[-0.2px] truncate">
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

export default SetupDashboard;
