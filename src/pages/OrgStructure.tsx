import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { WorkspacePage } from "@/components/WorkspacePage";
import { ArrowLeft, Plus, Upload, Settings2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { useOrgUnits, buildTree, OrgUnitTreeNode } from "@/hooks/useOrgUnits";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingStepFrame } from "@/components/onboarding/OnboardingStepFrame";
import SetupWizard from "@/components/org/SetupWizard";
import OnboardingStructureBuilder from "@/components/org/OnboardingStructureBuilder";
import OrgTree from "@/components/org/OrgTree";
import UnitDetailPanel from "@/components/org/UnitDetailPanel";
import AddUnitModal from "@/components/org/AddUnitModal";
import CsvImportModal from "@/components/org/CsvImportModal";
import EditLevelsModal from "@/components/org/EditLevelsModal";
import { PageHead } from "@/components/PageHead";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { friendlyError } from "@/lib/siaErrors";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";

const OrgStructure = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markComplete, isOnboarding } = useOnboarding();
  const {
    data: unitTypes = [],
    isLoading: loadingTypes,
    isError: typesError,
    error: typesErr,
    refetch: refetchTypes,
  } = useOrgUnitTypes();
  const {
    data: units = [],
    isLoading: loadingUnits,
    isError: unitsError,
    error: unitsErr,
    refetch: refetchUnits,
  } = useOrgUnits();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [showEditLevels, setShowEditLevels] = useState(false);
  const [addParent, setAddParent] = useState<OrgUnitTreeNode | null>(null);
  const [addTypeId, setAddTypeId] = useState<string>("");
  const [wizardDone, setWizardDone] = useState(false);

  const isNotAdmin = profile && profile.role !== "hr_admin";
  const loading = loadingTypes || loadingUnits;
  const loadError = typesError || unitsError;
  const loadErrorMessage =
    (typesErr instanceof Error ? typesErr.message : undefined) ??
    (unitsErr instanceof Error ? unitsErr.message : undefined);
  const retryLoad = () => {
    void refetchTypes();
    void refetchUnits();
  };
  const hasTypes = unitTypes.length > 0;
  const showWizard = !loading && !hasTypes && !wizardDone;
  

  useStepReadiness(
    "structure",
    !showWizard && hasTypes && units.length > 0,
    !showWizard && hasTypes && units.length > 0
      ? "Ready to continue."
      : "Configure your levels and add at least one unit to continue."
  );

  const typeMap = useMemo(() => {
    const m: Record<string, { name: string; level: number }> = {};
    unitTypes.forEach((t) => (m[t.id] = { name: t.name, level: t.level }));
    return m;
  }, [unitTypes]);

  const tree = useMemo(() => buildTree(units, typeMap), [units, typeMap]);
  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    const find = (nodes: OrgUnitTreeNode[]): OrgUnitTreeNode | null => {
      for (const n of nodes) {
        if (n.id === selectedId) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return null;
    };
    return find(tree);
  }, [selectedId, tree]);

  const sortedTypes = useMemo(() => [...unitTypes].sort((a, b) => a.level - b.level), [unitTypes]);
  const topLevelType = sortedTypes[0];

  const handleAddChild = (parent: OrgUnitTreeNode) => {
    const parentTypeLevel = parent.typeLevel;
    const childType = sortedTypes.find((t) => t.level === parentTypeLevel + 1);
    setAddParent(parent);
    setAddTypeId(childType?.id ?? "");
    setShowAdd(true);
  };

  if (isNotAdmin) {
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <QueryLoading className="w-full max-w-md" label="Loading organization structure" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <QueryError className="w-full max-w-md" message={loadErrorMessage} onRetry={retryLoad} />
      </div>
    );
  }

  if (showWizard) {
    const finishStructure = async () => {
      void queryClient.invalidateQueries({ queryKey: ["org_unit_types"] });
      void queryClient.invalidateQueries({ queryKey: ["org_units"] });
      try {
        await markComplete("structure");
      } catch (err) {
        toast.error(friendlyError(err, "Could not mark step complete"));
      }
      setWizardDone(true);
      navigate(isOnboarding ? "/org/employees" : "/dashboard");
    };

    if (isOnboarding) {
      return (
        <>
          <PageHead
            title="Set up structure | SIA"
            description="Build the org hierarchy that powers your appraisal cycles."
            path="/org/structure"
            noIndex
          />
          <OnboardingStepFrame
            stepKey="structure"
            title="Build your organization"
            subtitle="Choose a structure, then add the teams and departments your people belong to."
            primaryLabel="Continue"
            hideFooter
          >
            <OnboardingStructureBuilder
              industry={organization?.industry}
              onComplete={finishStructure}
            />
          </OnboardingStepFrame>
        </>
      );
    }

    return (
      <SetupWizard
        onComplete={finishStructure}
      />

    );
  }

  const pageInner = (
    <>
      {!isOnboarding && (
        <PageHeader
          title="Organization"
          subtitle="Shape the reporting structure that connects your people, managers, and appraisal cycles."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEditLevels(true)}>
                <Settings2 className="h-4 w-4" strokeWidth={1.75} /> Edit levels
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCsv(true)}>
                <Upload className="h-4 w-4" strokeWidth={1.75} /> Import CSV
              </Button>
              <Button size="sm" onClick={() => { setAddParent(null); setAddTypeId(""); setShowAdd(true); }}>
                <Plus className="h-4 w-4" strokeWidth={2} /> Add unit
              </Button>
            </>
          }
        />
      )}


      {isOnboarding && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setShowEditLevels(true)}>
            <Settings2 className="me-1 h-3 w-3" /> Edit levels
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCsv(true)}>
            <Upload className="me-1 h-3 w-3" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => { setAddParent(null); setAddTypeId(""); setShowAdd(true); }}>
            <Plus className="me-1 h-3 w-3" /> Add unit
          </Button>
        </div>
      )}

      {units.length === 0 ? (
        <div className={`rounded-2xl bg-surface-raised p-10 text-center shadow-[var(--shadow-border)] ${isOnboarding ? "" : "mt-10"}`}>
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-red/[0.12]">
            <Building2 className="h-6 w-6 text-accent-red" />
          </div>
          <h2 className="text-base font-semibold text-foreground text-balance">Your hierarchy is configured</h2>
          <p className="mt-1 text-sm text-ink-muted text-pretty">
            Add your first {topLevelType?.name ?? "unit"}.
          </p>
          <Button className="mt-6" onClick={() => { setAddParent(null); setAddTypeId(topLevelType?.id ?? ""); setShowAdd(true); }}>
            <Plus className="me-1 h-4 w-4" /> Add {topLevelType?.name ?? "unit"}
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${isOnboarding ? "grid-cols-1" : "min-[1180px]:grid-cols-[minmax(0,1fr)_340px]"} ${isOnboarding ? "" : "mt-8"}`}>
          <section className="rounded-2xl bg-surface-raised p-3 shadow-[var(--shadow-border)] sm:p-4" aria-label="Organization hierarchy">
            <OrgTree nodes={tree} selectedId={selectedId} onSelect={(n) => setSelectedId(n.id)} />
          </section>
          <aside className="self-start rounded-2xl bg-surface-raised p-6 shadow-[var(--shadow-border)] min-[1180px]:sticky min-[1180px]:top-20">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={selectedNode?.id ?? "empty-selection"}
                initial={{
                  opacity: 0,
                  transform: prefersReducedMotion ? "none" : "translateY(4px)",
                }}
                animate={{
                  opacity: 1,
                  transform: prefersReducedMotion ? "none" : "translateY(0px)",
                }}
                exit={{
                  opacity: 0,
                  transform: prefersReducedMotion ? "none" : "translateY(2px)",
                  transition: { duration: 0.1, ease: [0.2, 0, 0, 1] },
                }}
                transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
              >
                {selectedNode ? (
                  <UnitDetailPanel node={selectedNode} onAddChild={handleAddChild} />
                ) : (
                  <div className="py-8 text-center">
                    <Building2 className="mx-auto h-5 w-5 text-ink-subtle" strokeWidth={1.75} />
                    <p className="mt-3 text-sm font-medium text-foreground">Select a unit</p>
                    <p className="mt-1 text-sm text-ink-muted">Its details and available actions will appear here.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      )}

      <AddUnitModal open={showAdd} onOpenChange={setShowAdd} unitTypes={unitTypes} units={units} preselectedParent={addParent} preselectedTypeId={addTypeId} />
      <CsvImportModal open={showCsv} onOpenChange={setShowCsv} unitTypes={unitTypes} units={units} />
      <EditLevelsModal open={showEditLevels} onOpenChange={setShowEditLevels} unitTypes={unitTypes} hasUnits={units.length > 0} />
    </>
  );

  return (
    <>
      <PageHead
        title={isOnboarding ? "Set up structure | SIA" : "Organization structure | SIA"}
        description="Build the org hierarchy that powers your appraisal cycles."
        path="/org/structure"
        noIndex={isOnboarding}
      />
      {isOnboarding ? (
        <OnboardingStepFrame
          stepKey="structure"
          title="Build your organization"
          subtitle="Choose a structure, then add the teams and departments your people belong to."
          primaryLabel="Continue"
          hideFooter
        >
          {pageInner}
        </OnboardingStepFrame>
      ) : (
        <WorkspacePage>{pageInner}</WorkspacePage>
      )}

    </>
  );
};


export default OrgStructure;
