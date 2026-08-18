import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useOnboarding, type OnboardingStepKey } from "@/hooks/useOnboarding";
import { useOnboardingContext } from "./OnboardingContext";

/** Display order of the guided setup, excluding the implicit "account" step and
 * including the final review screen that lives on the dashboard. */
export const FLOW_STEPS: { key: OnboardingStepKey | "review"; href: string; accent: string }[] = [
  { key: "structure", href: "/org/structure", accent: "--accent-red" },
  { key: "people", href: "/org/employees", accent: "--accent-purple" },
  { key: "cycle", href: "/appraisals", accent: "--accent-green" },
  { key: "review", href: "/dashboard", accent: "--accent-blue" },
];

interface OnboardingStepFrameProps {
  stepKey: OnboardingStepKey | "review";
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Inline readiness line shown above the primary button. */
  statusLabel?: string;
  statusMet?: boolean;
  continueLabel: string;
  onContinue?: () => void | Promise<void>;
  continueDisabled?: boolean;
  /** Small reassurance caption under the primary button. */
  caption?: string;
  /** Optional secondary action rendered under the caption. */
  secondary?: React.ReactNode;
  children: React.ReactNode;
}

/** The single layout every onboarding step uses: centered header, one card,
 * one readiness line, one primary action, then a quiet Back link. */
export function OnboardingStepFrame({
  stepKey,
  eyebrow,
  title,
  subtitle,
  statusLabel,
  statusMet = false,
  continueLabel,
  onContinue,
  continueDisabled = false,
  caption,
  secondary,
  children,
}: OnboardingStepFrameProps) {
  const navigate = useNavigate();
  const { steps, markComplete, finishSetup, saving } = useOnboarding();
  const { readiness } = useOnboardingContext();

  const index = FLOW_STEPS.findIndex((s) => s.key === stepKey);
  const current = FLOW_STEPS[index];
  const previous = index > 0 ? FLOW_STEPS[index - 1] : null;
  const next = index < FLOW_STEPS.length - 1 ? FLOW_STEPS[index + 1] : null;

  const statusOf = (key: OnboardingStepKey | "review") => {
    if (key === "review") return "pending";
    const s = steps.find((st) => st.key === key);
    if (s?.done) return "done";
    if (s?.skipped) return "skipped";
    return "pending";
  };

  const r = stepKey === "review" ? undefined : readiness[stepKey];
  const ready = statusMet || !!r?.ready;

  const handleContinue = async () => {
    try {
      if (onContinue) {
        await onContinue();
        return;
      }
      if (stepKey === "review") {
        await finishSetup();
        return;
      }
      const step = steps.find((s) => s.key === stepKey);
      if (!step?.done && !step?.skipped) await markComplete(stepKey);
      if (next) navigate(next.href);
      else await finishSetup();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not complete this step");
    }
  };

  return (
    <div className="px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: `hsl(var(${current?.accent ?? "--accent-blue"}))` }}
          >
            {eyebrow}
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--ink-muted))] tabular-nums">
            Step {index + 1} of {FLOW_STEPS.length}
          </p>
          <ol className="mt-3 flex items-center justify-center gap-2" aria-label="Setup progress">
            {FLOW_STEPS.map((s, i) => {
              const st = statusOf(s.key);
              const color =
                i < index || st === "done"
                  ? "hsl(var(--accent-green))"
                  : st === "skipped"
                  ? "hsl(var(--accent-purple) / 0.5)"
                  : i === index
                  ? "hsl(var(--accent-blue))"
                  : "hsl(var(--hairline))";
              return (
                <li key={s.key}>
                  <span
                    className="block h-[4px] w-10 rounded-full md:w-14"
                    style={{
                      backgroundColor: color,
                      transitionProperty: "background-color",
                      transitionDuration: "200ms",
                    }}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ol>

          <h1 className="mt-8 font-[Space_Grotesk] text-[30px] leading-[1.08] font-semibold tracking-[-1px] text-foreground text-balance md:text-[44px]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[hsl(var(--ink-muted))] text-pretty">
            {subtitle}
          </p>
        </div>

        <div className="mt-8 text-left">{children}</div>

        {(statusLabel || r?.hint) && (
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-[hsl(var(--ink-muted))]">
            <CheckCircle2
              className="h-4 w-4 shrink-0"
              style={{ color: ready ? "hsl(var(--accent-green))" : "hsl(var(--ink-subtle))" }}
            />
            <span className="text-pretty">{statusLabel ?? r?.hint}</span>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleContinue}
            disabled={continueDisabled || saving || (!ready && stepKey !== "review")}
            className="h-12 w-full text-[15px] font-medium active:scale-[0.99] transition-transform"
          >
            {continueLabel}
          </Button>
        </div>

        {caption && (
          <p className="mt-3 text-center text-sm text-[hsl(var(--ink-subtle))]">{caption}</p>
        )}
        {secondary && <div className="mt-3 flex justify-center">{secondary}</div>}

        <div className="mt-8 h-px w-full bg-[hsl(var(--hairline))]" />
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={!previous}
            onClick={() => previous && navigate(previous.href)}
            className="text-[hsl(var(--ink-muted))]"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingStepFrame;
