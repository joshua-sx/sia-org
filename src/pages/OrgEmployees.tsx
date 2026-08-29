import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { WorkspacePage } from "@/components/WorkspacePage";
import { UserPlus, Upload, Download, AlertTriangle, ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingStepFrame } from "@/components/onboarding/OnboardingStepFrame";
import EmployeeEmptyState from "@/components/employees/EmployeeEmptyState";
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import EmployeeCsvImportModal from "@/components/employees/EmployeeCsvImportModal";
import { downloadTemplateCsv } from "@/lib/employeeCsv";
import { PageHead } from "@/components/PageHead";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { friendlyError } from "@/lib/siaErrors";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const blockingReason = employees.length === 0
    ? "No employees added yet. Add at least one employee to continue."
    : !hasManagerLink && employees.length > 1
      ? "Assign the required manager relationships to continue."
      : undefined;
  const readyHint = blockingReason ?? `${employees.length} ${employees.length === 1 ? "person" : "people"} added — ready to continue.`;

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
          <p className="mt-2 text-sm text-ink-muted">This area is for HR Administrators only.</p>
          <Button asChild variant="ghost" className="mt-6 gap-2 text-ink-muted">
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
      {!isOnboarding && (
        <PageHeader
          title="People"
          subtitle="Manage employee details, reporting lines, and organizational placement from one directory."
          actions={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4" strokeWidth={1.75} />
                    Import
                    <ChevronDown className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setImportOpen(true)}>
                    <Upload className="me-2 h-4 w-4" strokeWidth={1.75} />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadTemplateCsv}>
                    <Download className="me-2 h-4 w-4" strokeWidth={1.75} />
                    Download CSV template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openAdd}>
                <UserPlus className="h-4 w-4" strokeWidth={2} />
                Add person
              </Button>
            </>
          }
        />
      )}

      {showAttention && (
        <div className="mt-8 rounded-xl border border-accent-purple/[0.35] bg-accent-purple/[0.08] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-purple" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">People needs attention</p>
              <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                <span className="tabular-nums">{employeesWithoutManager.length}</span>{" "}
                {employeesWithoutManager.length === 1 ? "employee has" : "employees have"} no manager assigned.
                Assign at least one manager-employee relationship to continue.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={handleAssignManager}>
                  Assign manager
                </Button>
                <Button size="sm" variant="outline" onClick={openAdd} className="border-accent-blue text-accent-blue hover:bg-accent-blue/[0.08] hover:text-accent-blue">
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
            <EmployeeTable
              employees={employees}
              unitsById={unitsById}
              onEdit={openEdit}
              onDelete={(e) => setConfirmDelete(e)}
            />
          )}
      </div>
    </>
  );

  return (
    <>
      <PageHead
        title={isOnboarding ? "Add people | SIA" : "Employees | SIA"}
        description="Add and manage employees and manager relationships for your organization."
        path="/org/employees"
        noIndex={isOnboarding}
      />
      {isOnboarding ? (
          <OnboardingStepFrame
            stepKey="people"
            title="Add your people"
            subtitle="Import your employee list or add people one at a time."
            primaryLabel="Continue"
            hideFooter
          >
          {pageInner}
        </OnboardingStepFrame>
      ) : (
        <WorkspacePage>{pageInner}</WorkspacePage>
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
                } catch (err: unknown) {
                  toast.error(friendlyError(err, "Delete failed"));
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
