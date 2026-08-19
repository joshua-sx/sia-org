import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OnboardingStepKey } from "@/hooks/useOnboarding";

/** The four onboarding stages, each owning one SIA brand color, matching the
 *  sidebar: Setup (blue) → Structure (red) → People (purple) → Cycle (green). */
export const FLOW_STEPS: { key: OnboardingStepKey; label: string; href: string; accent: string }[] = [
  { key: "account", label: "Setup", href: "/onboarding/setup", accent: "--accent-blue" },
  { key: "structure", label: "Structure", href: "/org/structure", accent: "--accent-red" },
  { key: "people", label: "People", href: "/org/employees", accent: "--accent-purple" },
  { key: "cycle", label: "Cycle", href: "/appraisals", accent: "--accent-green" },
];

export type SegmentState = "done" | "current" | "upcoming";

/** Shared color rule for every setup progress indicator: only the current
 *  step carries its brand color, everything else stays neutral. */
export function stepSegmentColor(opts: { accent: string; state: SegmentState | "skipped" }) {
  if (opts.state === "current") return `hsl(var(${opts.accent}))`;
  if (opts.state === "done") return "hsl(var(--ink-subtle))";
  return "hsl(var(--hairline))";
}

/** Back + primary action, adjacent and right-aligned. One shared footer for
 *  every onboarding screen — never a full-width CTA. */
export function OnboardingActionFooter({
  backHref,
  backLabel = "Back",
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  disabledReason,
  loading = false,
  loadingLabel = "Saving…",
  primaryType = "button",
}: {
  backHref?: string | null;
  backLabel?: string;
  primaryLabel: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  loadingLabel?: string;
  primaryType?: "button" | "submit";
}) {
  const navigate = useNavigate();

  const primary = (
    <Button
      type={primaryType}
      onClick={onPrimary}
      disabled={primaryDisabled || loading}
      className="h-10 min-w-[120px] transition-transform duration-150 active:scale-[0.96]"
    >
      {loading ? loadingLabel : primaryLabel}
    </Button>
  );

  return (
    <div className="mt-8 flex items-center justify-center gap-2.5 border-t border-[hsl(var(--hairline))] pt-5">
      {backHref && (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(backHref)}
          className="h-10 min-w-[96px] transition-transform duration-150 active:scale-[0.96]"
        >
          {backLabel}
        </Button>
      )}
      {primaryDisabled && disabledReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {primary}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {disabledReason}
          </TooltipContent>
        </Tooltip>
      ) : (
        primary
      )}
    </div>
  );
}

interface OnboardingStepFrameProps {
  stepKey: OnboardingStepKey;
  /** Screen heading. */
  title: string;
  /** One concise supporting sentence. */
  subtitle: string;
  /** Primary footer action label. */
  primaryLabel: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  /** Named on the disabled primary as an accessible tooltip. */
  disabledReason?: string;
  loading?: boolean;
  loadingLabel?: string;
  /** Completion state of each step, for the progress segments. */
  completedKeys?: OnboardingStepKey[];
  /** Hide the shared footer (a nested flow owns its own actions). */
  hideFooter?: boolean;
  children: React.ReactNode;
}

/** The single layout every onboarding screen uses: centered header with four
 *  progress segments, left-aligned working content, one shared action footer. */
export function OnboardingStepFrame({
  stepKey,
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  disabledReason,
  loading = false,
  loadingLabel,
  completedKeys = [],
  hideFooter = false,
  children,
}: OnboardingStepFrameProps) {
  const index = FLOW_STEPS.findIndex((s) => s.key === stepKey);
  const current = FLOW_STEPS[index] ?? FLOW_STEPS[0];
  const previous = index > 0 ? FLOW_STEPS[index - 1] : null;

  const stateOf = (i: number): SegmentState => {
    if (i === index) return "current";
    if (i < index || completedKeys.includes(FLOW_STEPS[i].key)) return "done";
    return "upcoming";
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: `hsl(var(${current.accent}))` }}
          >
            {current.label}
          </p>

          <ol className="mt-3 flex items-center justify-center gap-2">
            <li className="sr-only">{`Step ${index + 1} of ${FLOW_STEPS.length}: ${current.label}`}</li>
            {FLOW_STEPS.map((s, i) => {
              const state = stateOf(i);
              return (
                <li
                  key={s.key}
                  aria-hidden
                  aria-current={state === "current" ? "step" : undefined}
                  className="flex items-center gap-1"
                >
                  <span
                    className="block h-[4px] w-10 rounded-full md:w-14"
                    style={{
                      backgroundColor: stepSegmentColor({ accent: s.accent, state }),
                      transitionProperty: "background-color",
                      transitionDuration: "150ms",
                    }}
                  />
                  {state === "done" && (
                    <Check className="h-3 w-3 shrink-0 text-[hsl(var(--ink-subtle))]" strokeWidth={2.5} />
                  )}
                </li>
              );
            })}
          </ol>

          <h1 className="mt-8 font-[Space_Grotesk] text-[30px] leading-[1.08] font-semibold tracking-[-1px] text-foreground text-balance md:text-[40px]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-[56ch] text-[15px] leading-relaxed text-[hsl(var(--ink-muted))] text-pretty">
            {subtitle}
          </p>
        </div>

        <div className="mt-8 text-left">{children}</div>

        {!hideFooter && (
          <OnboardingActionFooter
            backHref={previous?.href ?? null}
            primaryLabel={primaryLabel}
            onPrimary={onPrimary}
            primaryDisabled={primaryDisabled}
            disabledReason={disabledReason}
            loading={loading}
            loadingLabel={loadingLabel}
          />
        )}
      </div>
    </div>
  );
}

export default OnboardingStepFrame;
