import { Check } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { WorkspaceSidebar } from "@/components/navigation/WorkspaceSidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { deriveOnboardingSteps } from "@/lib/onboardingSteps";
import {
  getWorkspaceNavigationGroups,
  type WorkspaceProfileRole,
} from "@/lib/workspaceNavigation";

type PreviewRole = "hr" | "manager" | "employee" | "reviewer" | "onboarding";

const roleOptions: { value: PreviewRole; label: string }[] = [
  { value: "hr", label: "HR Admin" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
  { value: "reviewer", label: "Reviewer" },
  { value: "onboarding", label: "Onboarding" },
];

const onboardingSteps = deriveOnboardingSteps({
  account: { done: true, skipped: false },
  structure: { done: true, skipped: false },
  people: { done: false, skipped: false },
  cycle: { done: false, skipped: false },
});

function roleConfiguration(role: PreviewRole) {
  const profileRole: WorkspaceProfileRole =
    role === "hr" || role === "onboarding"
      ? "hr_admin"
      : role === "manager"
        ? "manager"
        : "employee";
  return {
    groups: getWorkspaceNavigationGroups(profileRole),
    roleLabel:
      role === "hr" || role === "onboarding"
        ? "HR Administrator"
        : role === "manager"
          ? "Manager"
          : "Employee",
    title:
      role === "onboarding"
        ? "Onboarding navigation"
        : role === "reviewer"
          ? "Employee with reviewer work"
          : `${roleOptions.find((option) => option.value === role)?.label} navigation`,
    onboarding:
      role === "onboarding"
        ? { steps: onboardingSteps, progressCount: 2, totalSteps: 4 }
        : undefined,
    activePath:
      role === "onboarding"
        ? "/org/employees"
        : role === "reviewer" || role === "manager"
          ? "/appraisals/assessments"
          : "/dashboard",
  };
}

export default function SidebarSystemPreview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRole = searchParams.get("role") as PreviewRole | null;
  const role = roleOptions.some((option) => option.value === requestedRole)
    ? requestedRole!
    : "hr";
  const config = roleConfiguration(role);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <WorkspaceSidebar
          organizationName="Sia Labs"
          profileName="Jamie Morgan"
          profileEmail="jamie@sialabs.example"
          initials="JM"
          roleLabel={config.roleLabel}
          groups={config.groups}
          activePath={config.activePath}
          onboarding={config.onboarding}
          onSignOut={() => {}}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center gap-2 border-b border-hairline bg-surface-raised/90 px-4 py-2 backdrop-blur">
            <SidebarTrigger className="size-10 rounded-lg" />
            <p className="me-auto text-sm font-medium text-foreground">Sidebar system preview</p>
            <div className="flex flex-wrap gap-1" aria-label="Preview role">
              {roleOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={role === option.value ? "secondary" : "ghost"}
                  aria-pressed={role === option.value}
                  onClick={() => setSearchParams({ role: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8" id="main-content">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Development preview</p>
            <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold tracking-tight text-foreground">
              {config.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              One shared shell adapts to real permissions and setup state. Navigation stays
              predictable while unavailable destinations disappear instead of becoming disabled clutter.
            </p>

            <section className="mt-8 max-w-2xl rounded-xl border border-hairline bg-surface-raised p-5">
              <h2 className="text-sm font-semibold text-foreground">UX contract</h2>
              <ul className="mt-4 space-y-3">
                {[
                  "Only destinations this person can use are visible.",
                  "Search returns the same authorized navigation model.",
                  "Onboarding replaces normal navigation until setup is finished.",
                  "Collapsed and mobile states preserve labels through tooltips and accessible names.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-ink-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-green" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
