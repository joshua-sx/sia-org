import { WorkspaceSidebar } from "@/components/navigation/WorkspaceSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  getWorkspaceNavigationGroups,
  type WorkspaceProfileRole,
} from "@/lib/workspaceNavigation";

function initialsFor(name?: string) {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  );
}

export function AppSidebar() {
  const { profile, organization, signOut } = useAuth();
  const onboarding = useOnboarding();
  const profileRole: WorkspaceProfileRole =
    profile?.role === "hr_admin" || profile?.role === "manager"
      ? profile.role
      : "employee";

  return (
    <WorkspaceSidebar
      organizationName={organization?.name ?? "Your organization"}
      profileName={profile?.full_name ?? "User"}
      profileEmail={profile?.email}
      initials={initialsFor(profile?.full_name)}
      roleLabel={
        profileRole === "hr_admin"
          ? "HR Administrator"
          : profileRole === "manager"
            ? "Manager"
            : "Employee"
      }
      groups={getWorkspaceNavigationGroups(profileRole)}
      onboarding={
        onboarding.isOnboarding
          ? {
              steps: onboarding.steps,
              progressCount: onboarding.progressCount,
              totalSteps: onboarding.totalSteps,
            }
          : undefined
      }
      onSignOut={() => void signOut()}
    />
  );
}
