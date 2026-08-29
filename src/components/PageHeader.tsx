import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <header className={cn("flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.75px] text-foreground font-[Space_Grotesk] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm leading-6 text-ink-muted text-pretty">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
