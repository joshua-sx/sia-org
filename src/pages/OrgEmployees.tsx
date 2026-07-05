import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingStrip from "@/components/onboarding/OnboardingStrip";
import EmployeeEmptyState from "@/components/employees/EmployeeEmptyState";
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import EmployeeCsvImportModal from "@/components/employees/EmployeeCsvImportModal";
import { downloadTemplateCsv } from "@/lib/employeeCsv";
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
  const navigate = useNavigate();
  const { data: employees = [], isLoading, deleteEmployee } = useEmployees();
  const { data: units = [] } = useOrgUnits();
  const { markComplete, markSkipped, isOnboarding } = useOnboarding();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
  const [showJustAddedBanner, setShowJustAddedBanner] = useState(false);

  const unitsById = useMemo(() => {
    const m: Record<string, string> = {};
    units.forEach((u) => (m[u.id] = u.name));
    return m;
  }, [units]);

  // Auto-mark people step complete the first time an employee exists
  useEffect(() => {
    if (employees.length > 0 && isOnboarding) {
      markComplete("people").catch(() => {});
    }
  }, [employees.length, isOnboarding, markComplete]);

  if (profile && profile.role !== "hr_admin") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[hsl(var(--ink-muted))]">HR admins only.</p>
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

  const handleSkip = async () => {
    await markSkipped("people");
    toast.info("Skipped for now. You can add people any time.");
    navigate("/dashboard");
  };

  const empty = !isLoading && employees.length === 0;

  return (
    <>
      <OnboardingStrip />

      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-red))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-red))]" />
              People
            </p>
            <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
              Employees
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
              {empty
                ? "Add the people who take part in appraisal cycles."
                : `${employees.length} ${employees.length === 1 ? "person" : "people"} in your organization.`}
            </p>
          </div>

          {!empty && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={downloadTemplateCsv} className="text-[hsl(var(--ink-muted))]">
                <Download className="mr-1 h-3 w-3" /> Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="mr-1 h-3 w-3" /> Import CSV
              </Button>
              <Button size="sm" onClick={openAdd} className="active:scale-[0.96] transition-transform">
                <Plus className="mr-1 h-3 w-3" /> Add employee
              </Button>
            </div>
          )}
        </div>

        <div className="mt-10">
          {isLoading ? (
            <p className="text-sm text-[hsl(var(--ink-muted))]">Loading…</p>
          ) : empty ? (
            <EmployeeEmptyState
              onImport={() => setImportOpen(true)}
              onAddManual={openAdd}
              onSkip={handleSkip}
            />
          ) : (
            <>
              {showJustAddedBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--accent-green)/0.3)] bg-[hsl(var(--accent-green)/0.06)] px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: "hsl(var(--accent-green))" }}
                    >
                      ✓
                    </span>
                    <span className="text-foreground font-medium">People added.</span>
                    <span className="text-[hsl(var(--ink-muted))]">
                      Next up: create your first appraisal cycle.
                    </span>
                  </div>
                  <Button size="sm" onClick={() => navigate("/dashboard")} className="active:scale-[0.96] transition-transform">
                    Continue <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </motion.div>
              )}
              <EmployeeTable
                employees={employees}
                unitsById={unitsById}
                onEdit={openEdit}
                onDelete={(e) => setConfirmDelete(e)}
              />
            </>
          )}
        </div>
      </div>

      <EmployeeFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={() => {
          if (employees.length === 0) setShowJustAddedBanner(true);
        }}
      />
      <EmployeeCsvImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={(n) => {
          if (n > 0 && employees.length === 0) setShowJustAddedBanner(true);
        }}
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
