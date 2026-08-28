import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Section navigation for the /appraisals namespace. Team goals is only
 * relevant to managers and HR; Assessments is shown to everyone because any
 * employee can be picked as an extra reviewer.
 */
export function AppraisalsTabs() {
  const { profile } = useAuth();
  const canManage = profile?.role === "hr_admin" || profile?.role === "manager";

  const tabs = [
    { to: "/appraisals", label: "Cycles", end: true, show: true },
    { to: "/appraisals/goals", label: "Team goals", end: false, show: canManage },
    { to: "/appraisals/assessments", label: "Assessments", end: false, show: true },
    { to: "/appraisals/my-review", label: "My review", end: false, show: true },
  ].filter((t) => t.show);

  return (
    <div className="mt-6 flex flex-wrap gap-1 border-b border-hairline">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className="relative -mb-px rounded-t-md px-3 py-2 text-sm text-ink-muted transition-colors hover:text-foreground"
          activeClassName="!text-foreground font-medium after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-accent-yellow-ink"
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
