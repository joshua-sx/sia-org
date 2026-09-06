import { Check, Circle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { OnboardingStep } from "@/lib/onboardingSteps";
import { cn } from "@/lib/utils";

interface OnboardingNavigationProps {
  steps: OnboardingStep[];
  progressCount: number;
  totalSteps: number;
  collapsed: boolean;
  onNavigate: () => void;
  activePath?: string;
}

const stepLabels = {
  account: "Account",
  structure: "Structure",
  people: "People & access",
  cycle: "Review cycle",
} as const;

const statusLabels = {
  done: "Complete",
  current: "In progress",
  next: "Next",
  skipped: "Set up later",
} as const;

const accentClasses = {
  "--accent-blue": "text-accent-blue",
  "--accent-red": "text-accent-red",
  "--accent-purple": "text-accent-purple",
  "--accent-green": "text-accent-green",
} as const;

const activeClasses = {
  "--accent-blue":
    "relative bg-accent-blue/[0.1] text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-blue",
  "--accent-red":
    "relative bg-accent-red/[0.09] text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-red",
  "--accent-purple":
    "relative bg-accent-purple/[0.1] text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-purple",
  "--accent-green":
    "relative bg-accent-green/[0.1] text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-green",
} as const;

export function OnboardingNavigation({
  steps,
  progressCount,
  totalSteps,
  collapsed,
  onNavigate,
  activePath,
}: OnboardingNavigationProps) {
  const progressPercent = Math.round((progressCount / totalSteps) * 100);

  return (
    <nav aria-label="Workspace setup">
      <SidebarGroup className="px-3 py-2">
        {!collapsed && (
          <div className="mb-3 px-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Workspace setup</p>
              <p className="text-xs tabular-nums text-ink-muted">
                {progressCount} of {totalSteps}
              </p>
            </div>
            <div
              className="mt-3 h-1 overflow-hidden rounded-full bg-ink-strong/[0.08]"
              role="progressbar"
              aria-label="Workspace setup progress"
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-valuenow={progressCount}
              aria-valuetext={`${progressCount} of ${totalSteps} steps complete`}
            >
              <div
                className="h-full rounded-full bg-accent-purple transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        <SidebarGroupLabel className="sr-only">Setup steps</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const status = statusLabels[step.status];
              const label = stepLabels[step.key];
              const selectedClasses = activeClasses[step.accent];
              return (
                <SidebarMenuItem key={step.key}>
                  <SidebarMenuButton
                    asChild
                    tooltip={`${label} · ${status}`}
                    className="h-auto min-h-12 rounded-lg px-3 py-2 text-ink-muted transition-colors duration-150 hover:bg-ink-strong/[0.05] hover:text-foreground group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0"
                  >
                    <NavLink
                      to={step.href}
                      end={step.key === "account"}
                      onClick={onNavigate}
                      className={cn(activePath === step.href && selectedClasses)}
                      activeClassName={selectedClasses}
                    >
                      <span className="relative flex size-6 shrink-0 items-center justify-center">
                        <StepIcon
                          className={accentClasses[step.accent]}
                          aria-hidden="true"
                        />
                        <span className="sr-only">Step {index + 1}</span>
                      </span>
                      <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <span className="block truncate text-sm font-medium text-foreground">{label}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/70">
                          {step.status === "done" ? (
                            <Check className="size-3 text-accent-green" aria-hidden="true" />
                          ) : (
                            <Circle className="size-2.5" aria-hidden="true" />
                          )}
                          {status}
                        </span>
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
