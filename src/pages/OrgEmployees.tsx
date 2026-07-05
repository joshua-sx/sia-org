import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

const OrgEmployees = () => (
  <div className="px-6 md:px-10 py-10 max-w-4xl">
    <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-yellow))]">
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-yellow))]" />
      People
    </p>
    <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk]">
      Employees
    </h1>
    <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
      Manage the people who take part in appraisal cycles.
    </p>

    <div className="mt-8 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: "hsl(var(--accent-yellow) / 0.12)" }}
      >
        <Users className="h-6 w-6" style={{ color: "hsl(var(--accent-yellow))" }} />
      </div>
      <h2 className="text-base font-semibold text-foreground">
        Employees are coming soon
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[hsl(var(--ink-muted))]">
        This surface will let you invite people, assign them to units, and manage their roles.
      </p>
      <Button asChild variant="ghost" className="mt-6 gap-2 text-[hsl(var(--ink-muted))]">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>
    </div>
  </div>
);

export default OrgEmployees;
