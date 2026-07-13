import { CompletionCriteria, type CompletionCriterion } from "./CompletionCriteria";

interface OnboardingStepHeaderProps {
  eyebrow: string;
  eyebrowAccent: string;
  title: string;
  subtitle: string;
  criteria?: CompletionCriterion[];
  criteriaAccent?: string;
  /** Optional local sub-step label, e.g. "PEOPLE · CHECK 3 OF 3" */
  localStepLabel?: string;
}

export function OnboardingStepHeader({
  eyebrow,
  eyebrowAccent,
  title,
  subtitle,
  criteria,
  criteriaAccent,
  localStepLabel,
}: OnboardingStepHeaderProps) {
  return (
    <header className="mb-7">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: `hsl(var(${eyebrowAccent}))` }}
      >
        {localStepLabel ?? eyebrow}
      </p>
      <h1 className="mt-2 text-[32px] md:text-[36px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance leading-[1.15]">
        {title}
      </h1>
      <p className="mt-2 text-[15px] text-[hsl(var(--ink-muted))] leading-relaxed text-pretty">
        {subtitle}
      </p>
      {criteria && criteria.length > 0 && criteriaAccent && (
        <div className="mt-3">
          <CompletionCriteria accent={criteriaAccent} criteria={criteria} />
        </div>
      )}
    </header>
  );
}

export default OnboardingStepHeader;
