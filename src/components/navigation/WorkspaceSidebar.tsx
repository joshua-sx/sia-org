import { Building2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { OnboardingStep } from "@/lib/onboardingSteps";
import type { RoleNavigationGroup } from "@/lib/workspaceNavigation";
import { OnboardingNavigation } from "./OnboardingNavigation";
import { SidebarAccount } from "./SidebarAccount";
import { WorkspaceNavigation } from "./WorkspaceNavigation";
import { WorkspaceSearch } from "./WorkspaceSearch";

interface WorkspaceSidebarProps {
  organizationName: string;
  profileName: string;
  profileEmail?: string;
  initials: string;
  roleLabel: string;
  groups: RoleNavigationGroup[];
  activePath?: string;
  onboarding?: {
    steps: OnboardingStep[];
    progressCount: number;
    totalSteps: number;
  };
  onSignOut: () => void;
}

export function WorkspaceSidebar({
  organizationName,
  profileName,
  profileEmail,
  initials,
  roleLabel,
  groups,
  activePath,
  onboarding,
  onSignOut,
}: WorkspaceSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const compact = state === "collapsed" && !isMobile;
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-e border-hairline bg-sidebar">
      <SidebarHeader className={compact ? "px-3 py-5" : "gap-3 px-4 py-5"}>
        <div className="flex min-h-10 items-center gap-3">
          {compact ? (
            <Link
              to="/dashboard"
              aria-label="Sia overview"
              className="mx-auto flex size-10 items-center justify-center rounded-lg font-[Space_Grotesk] text-base font-bold text-foreground transition-colors hover:bg-ink-strong/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              S
            </Link>
          ) : (
            <BrandMark size="sm" to="/dashboard" />
          )}
          {isMobile && (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close navigation"
              className="ms-auto flex size-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink-strong/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          className={
            compact
              ? "mx-auto flex size-10 items-center justify-center rounded-lg border border-hairline bg-surface-raised text-ink-muted"
              : "flex min-h-10 items-center gap-2 rounded-lg border border-hairline bg-surface-raised px-3 py-2"
          }
          title={compact ? organizationName : undefined}
        >
          <Building2 className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          {!compact && (
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {organizationName}
            </span>
          )}
        </div>

        {!onboarding && (
          <WorkspaceSearch groups={groups} collapsed={compact} onNavigate={closeMobile} />
        )}
      </SidebarHeader>

      <SidebarContent className="pb-3">
        {onboarding ? (
          <OnboardingNavigation
            steps={onboarding.steps}
            progressCount={onboarding.progressCount}
            totalSteps={onboarding.totalSteps}
            collapsed={compact}
            onNavigate={closeMobile}
            activePath={activePath}
          />
        ) : (
          <WorkspaceNavigation groups={groups} onNavigate={closeMobile} activePath={activePath} />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-hairline px-3 py-3">
        <SidebarAccount
          name={profileName}
          email={profileEmail}
          initials={initials}
          roleLabel={roleLabel}
          collapsed={compact}
          onSignOut={onSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
