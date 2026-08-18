import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { UserPlus, Upload, Download, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingPageShell } from "@/components/onboarding/OnboardingPageShell";
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader";
import EmployeeEmptyState from "@/components/employees/EmployeeEmptyState";
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import EmployeeCsvImportModal from "@/components/employees/EmployeeCsvImportModal";
import { downloadTemplateCsv } from "@/lib/employeeCsv";
import { PageHead } from "@/components/PageHead";
import { QueryError, QueryLoading } from "@/components/QueryState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrgEmployees = () => {
  const { profile } = useAuth();
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
    refetch,
    deleteEmployee,
  } = useEmployees();
  const { data: units = [] } = useOrgUnits();
  const { isOnboarding } = useOnboarding();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);


  const hasManagerLink = useMemo(
    () => employees.some((e) => !!e.manager_id),
    [employees]
  );
  const employeesWithoutManager = useMemo(
    () => employees.filter((e) => !e.manager_id),
    [employees]
  );
  // A single employee has nobody to report to — a manager link isn't
  // possible yet, so don't gate on it until there's a second person.
  const ready = employees.length >= 1 && (hasManagerLink || employees.length === 1);
  const readyHint = employees.length === 0
    ? "Add at least 1 employee to continue."
    : !hasManagerLink && employees.length > 1
      ? "Assign a manager relationship to continue."
      : `${employees.length} ${employees.length === 1 ? "person" : "people"} added — ready to continue.`;

  useStepReadiness("people", ready, readyHint);

  const unitsById = useMemo(() => {
    const m: Record<string, string> = {};
    units.forEach((u) => (m[u.id] = u.name));
    return m;
  }, [units]);

  if (profile && profile.role !== "hr_admin") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-[Space_Grotesk]">Access restricted</h1>
          <p className="mt-2 text-sm text-[hsl(var(--ink-muted))]">This area is for HR Administrators only.</p>
          <Button asChild variant="ghost" className="mt-6 gap-2 text-[hsl(var(--ink-muted))]">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setFormOpen(true);
  };

  const handleAssignManager = () => {
    const target = employeesWithoutManager[0];
    if (target) openEdit(target);
  };

  const empty = !isLoading && employees.length === 0;
  const showAttention = !empty && !hasManagerLink && employees.length > 1;

  const pageInner = (
    <>
      {isOnboarding ? (
        <OnboardingStepHeader
          eyebrow="PEOPLE"
          eyebrowAccent="--accent-purple"
          title="Add your team"
          subtitle="Import a CSV or add people manually."
          criteriaAccent="--accent-purple"
          criteria={[
            { label: "At least 1 employee added", met: employees.length >= 1 },
            {
              label: "At least one manager relationship set (once you have 2+ people)",
              met: hasManagerLink || employees.length <= 1,
            },
          ]}
        />
      ) : (
        <PageHeader
          title="Add your employees"
          subtitle="Add employees manually or import a CSV to build your reporting structure and prepare for appraisal cycles. No invitations will be sent during setup."
        />
      )}

      {showAttention && (
        <div
          className="rounded-xl border p-4 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          style={{
            backgroundColor: "hsl(var(--accent-purple) / 0.08)",
            borderColor: "hsl(var(--accent-purple) / 0.35)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--accent-purple))" }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">People needs attention</p>
              <p className="mt-1 text-xs text-[hsl(var(--ink-muted))] leading-relaxed">
                <span className="tabular-nums">{employeesWithoutManager.length}</span>{" "}
                {employeesWithoutManager.length === 1 ? "employee has" : "employees have"} no manager assigned.
                Assign at least one manager-employee relationship to continue.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleAssignManager}>
                  Assign manager
                </Button>
                <Button size="sm" variant="outline" onClick={openAdd} className="border-[hsl(var(--accent-blue))] text-[hsl(var(--accent-blue))] hover:bg-[hsl(var(--accent-blue)/0.08)] hover:text-[hsl(var(--accent-blue))]">
                  Add another employee
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={isOnboarding ? "" : "mt-8"}>
          {isLoading ? (
            <QueryLoading label="Loading employees" />
          ) : isError ? (
            <QueryError
              message={error instanceof Error ? error.message : undefined}
              onRetry={() => void refetch()}
            />
          ) : empty ? (
            <EmployeeEmptyState
              onImport={() => setImportOpen(true)}
              onAddManual={openAdd}
            />
          ) : (
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex flex-wrap gap-2 p-4 border-b border-[hsl(var(--hairline))]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openAdd}
                  className="border-[hsl(var(--accent-blue)/0.4)] text-[hsl(var(--accent-blue))] bg-[hsl(var(--accent-blue)/0.06)] hover:bg-[hsl(var(--accent-blue)/0.12)] hover:text-[hsl(var(--accent-blue))]"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add manually
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV
                </Button>
                <Button size="sm" variant="outline" onClick={downloadTemplateCsv}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV template
                </Button>
              </div>
              <EmployeeTable
                employees={employees}
                unitsById={unitsById}
                onEdit={openEdit}
                onDelete={(e) => setConfirmDelete(e)}
              />
            </div>
          )}
      </div>
    </>
  );

  return (
    <>
      <PageHead
        title="Employees | SIA"
        description="Add and manage employees and manager relationships for your organization."
        path="/org/employees"
      />
      {isOnboarding ? (
        <OnboardingPageShell>{pageInner}</OnboardingPageShell>
      ) : (
        <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">{pageInner}</div>
      )}
      <EmployeeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={() => {}}
      />
      <EmployeeCsvImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {}}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {confirmDelete?.first_name} {confirmDelete?.last_name} from
              your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteEmployee.mutateAsync(confirmDelete.id);
                  toast.success("Employee removed");
                } catch (err: any) {
                  toast.error(err?.message ?? "Delete failed");
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrgEmployees;
