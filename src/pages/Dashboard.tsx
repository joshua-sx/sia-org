import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Building2,
  Users,
  CalendarClock,
  UserCircle2,
} from "lucide-react";

const ACCENTS = ["--accent-blue", "--accent-red", "--accent-yellow", "--accent-green"] as const;

const Dashboard = () => {
  const { profile, organization } = useAuth();

  const checklist = [
    { label: "Account created", icon: UserCircle2, done: true },
    {
      label: "Configure org hierarchy",
      icon: Building2,
      done: !!organization?.setup_complete,
      href: "/org/structure",
    },
    { label: "Add employees", icon: Users, done: false, href: "/org/employees" },
    { label: "Create appraisal cycle", icon: CalendarClock, done: false },
  ];

  const completed = checklist.filter((c) => c.done).length;
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="px-6 md:px-10 py-10 max-w-4xl">
      {/* Header row — welcome + org meta chip */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-blue))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-blue))]" />
            Overview
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            {completed} of {checklist.length} setup steps complete.
          </p>
        </div>

        {organization && (
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-w-[220px]">
            <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
              Organization
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground truncate">
              {organization.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {organization.industry && (
                <span className="inline-flex items-center rounded-full bg-[hsl(var(--accent-blue)/0.1)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--accent-blue))]">
                  {organization.industry}
                </span>
              )}
              {organization.country && (
                <span className="inline-flex items-center rounded-full bg-[hsl(var(--accent-green)/0.1)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--accent-green))]">
                  {organization.country}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bento grid: checklist + cycle status */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {/* Setup checklist — spans 2 */}
        <div className="md:col-span-2 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--hairline))]">
            <h2 className="text-sm font-semibold text-foreground">Setup checklist</h2>
            <span className="text-xs text-[hsl(var(--ink-muted))] tabular-nums">
              {completed}/{checklist.length}
            </span>
          </div>
          <div className="divide-y divide-[hsl(var(--hairline))]">
            {checklist.map((item, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 px-5 py-3.5">
                  {/* Icon tile — 10% tint of accent */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `hsl(var(${accent}) / 0.1)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `hsl(var(${accent}))` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        item.done
                          ? "text-[hsl(var(--ink-subtle))] line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.done ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-[hsl(var(--accent-green))]" />
                  ) : item.href ? (
                    <Link to={item.href}>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--accent-blue))] hover:bg-[hsl(var(--accent-blue)/0.08)]">
                        Configure <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    <Circle className="h-[18px] w-[18px] text-[hsl(var(--ink-subtle))]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cycle status tile */}
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: "hsl(var(--accent-yellow) / 0.15)" }}
            >
              <CalendarClock className="h-4 w-4" style={{ color: "hsl(var(--accent-yellow))" }} />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Appraisal cycle</h2>
          </div>
          <p className="mt-3 text-sm text-[hsl(var(--ink-muted))]">
            No active cycle yet.
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--ink-subtle))]">
            Finish setup, then launch your first review.
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent-yellow)/0.15)] px-2.5 py-1 text-[11px] font-medium text-[hsl(45,70%,32%)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-yellow))]" />
              Awaiting setup
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
