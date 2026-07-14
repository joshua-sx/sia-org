import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared header for top-level product pages (Dashboard, Structure, Employees,
 * Appraisals, ...). Bold title + gray subtitle + optional right-aligned
 * actions — no eyebrow labels or icons above the title. Colored eyebrows are
 * reserved for the onboarding step chrome (OnboardingStepHeader), where the
 * accent is a wayfinding signal for "which setup step am I in."
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className ?? ""}`}>
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))] text-pretty">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
