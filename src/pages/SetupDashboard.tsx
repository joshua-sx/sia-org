import { useNavigate } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LAUNCH_COPY, CYCLE_SUBSTEPS } from "@/content/onboardingCopy";
import { OnboardingPipeline } from "@/components/onboarding/OnboardingPipeline";

export function SetupDashboard() {
  const navigate = useNavigate();
  const { steps, finishSetup, nextStepAfter, saving } = useOnboarding();

  const current =
    steps.find((s) => s.status === "current") ?? steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const copy = LAUNCH_COPY[current.key];

  const remaining = steps.filter((s) => !s.done && !s.skipped).length;
  const statusLabel = remaining <= 1 ? "Almost ready" : `${remaining} steps left`;
  const doneCount = steps.filter((s) => s.done).length;

  const next = nextStepAfter(current.key);
  const nextHint =
    current.key === "cycle" ? CYCLE_SUBSTEPS[1] : next ? `${next.label} — ${LAUNCH_COPY[next.key].ctaTitle}` : null;

  const handleCta = () => {
    if (current.href) navigate(current.href);
  };

  return (
    <>
      <PageHead
        title="Dashboard | SIA"
        description="Track appraisal setup progress and manage your SIA workspace."
        path="/dashboard"
      />
      <div className="px-6 py-12 md:py-16">
        <div className="mx-auto w-full max-w-[560px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent-blue))]">
            Setup
          </p>

          <p className="mt-6 text-sm text-[hsl(var(--ink-muted))]">{statusLabel}</p>
          <div className="mt-3">
            <OnboardingPipeline steps={steps} currentKey={current.key} variant="bars" />
          </div>

          <h1 className="mt-8 font-[Space_Grotesk] text-[34px] md:text-[40px] leading-[1.1] font-semibold tracking-[-1px] text-foreground text-balance">
            {copy.ctaTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-[44ch] text-[15px] leading-relaxed text-[hsl(var(--ink-muted))] text-pretty">
            {copy.ctaBody}
          </p>

          <div className="mt-9 flex flex-col items-center gap-3">
            <Button onClick={handleCta} className="h-12 w-full max-w-[300px] text-[15px] font-medium">
              {copy.ctaLabel}
            </Button>
            {doneCount > 1 && (
              <button
                onClick={() => finishSetup()}
                disabled={saving}
                className="rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--accent-blue))] transition-colors hover:text-[hsl(var(--accent-blue))]/80 disabled:opacity-60"
              >
                Review completed setup
              </button>
            )}
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[hsl(var(--ink-subtle))]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Invitations are only sent after you review and confirm launch.</span>
          </div>

          {nextHint && (
            <>
              <div className="mx-auto mt-8 h-px w-full max-w-[400px] bg-[hsl(var(--hairline))]" />
              <p className="mt-5 text-sm text-[hsl(var(--ink-muted))]">Next: {nextHint}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SetupDashboard;
