import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Plus, Upload, Settings2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { useOrgUnits, buildTree, OrgUnitTreeNode } from "@/hooks/useOrgUnits";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { OnboardingPageShell } from "@/components/onboarding/OnboardingPageShell";
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader";
import SetupWizard from "@/components/org/SetupWizard";
import OrgTree from "@/components/org/OrgTree";
import UnitDetailPanel from "@/components/org/UnitDetailPanel";
import AddUnitModal from "@/components/org/AddUnitModal";
import CsvImportModal from "@/components/org/CsvImportModal";
import EditLevelsModal from "@/components/org/EditLevelsModal";
import { PageHead } from "@/components/PageHead";
import { QueryError, QueryLoading } from "@/components/QueryState";

const OrgStructure = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { markComplete, isOnboarding } = useOnboarding();
  const {
    data: unitTypes = [],
    isLoading: loadingTypes,
    isError: typesError,
    error: typesErr,
    refetch: refetchTypes,
    createTypes,
  } = useOrgUnitTypes();
  const {
    data: units = [],
    isLoading: loadingUnits,
    isError: unitsError,
    error: unitsErr,
    refetch: refetchUnits,
    addUnit,
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
          <p className="mt-2 text-sm text-[hsl(var(--ink-muted))]">This area is for HR Administrators only.</p>
          <Button asChild variant="ghost" className="mt-6 gap-2 text-[hsl(var(--ink-muted))]">
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
    return (
      <SetupWizard
        isOnboarding={isOnboarding}
        onComplete={async () => {
          try {
            await markComplete("structure");
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Could not mark step complete";
            toast.error(message);
          }
          setWizardDone(true);
          navigate(isOnboarding ? "/org/employees" : "/dashboard");
        }}
        createTypes={createTypes}
        addUnit={addUnit}
      />
    );
  }

  const pageInner = (
    <>
      {!isOnboarding && (
        <PageHeader
          title="Organization structure"
          subtitle="Create and manage the divisions, departments, and teams within your organization."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEditLevels(true)}>
                <Settings2 className="mr-1 h-3 w-3" /> Edit levels
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCsv(true)}>
                <Upload className="mr-1 h-3 w-3" /> Import CSV
              </Button>
              <Button size="sm" onClick={() => { setAddParent(null); setAddTypeId(""); setShowAdd(true); }}>
                <Plus className="mr-1 h-3 w-3" /> Add unit
              </Button>
            </>
          }
        />
      )}


      {isOnboarding && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setShowEditLevels(true)}>
            <Settings2 className="mr-1 h-3 w-3" /> Edit levels
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCsv(true)}>
            <Upload className="mr-1 h-3 w-3" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => { setAddParent(null); setAddTypeId(""); setShowAdd(true); }}>
            <Plus className="mr-1 h-3 w-3" /> Add unit
          </Button>
        </div>
      )}

      {units.length === 0 ? (
        <div className={`rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${isOnboarding ? "" : "mt-10"}`}>
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: "hsl(var(--accent-red) / 0.12)" }}
          >
            <Building2 className="h-6 w-6" style={{ color: "hsl(var(--accent-red))" }} />
          </div>
          <h2 className="text-base font-semibold text-foreground text-balance">Your hierarchy is configured</h2>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))] text-pretty">
            Add your first {topLevelType?.name ?? "unit"}.
          </p>
          <Button className="mt-6" onClick={() => { setAddParent(null); setAddTypeId(topLevelType?.id ?? ""); setShowAdd(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Add {topLevelType?.name ?? "unit"}
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${isOnboarding ? "grid-cols-1" : "lg:grid-cols-[1fr_320px]"} ${isOnboarding ? "" : "mt-6"}`}>
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <OrgTree nodes={tree} selectedId={selectedId} onSelect={(n) => setSelectedId(n.id)} />
          </div>
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {selectedNode ? (
              <UnitDetailPanel node={selectedNode} onAddChild={handleAddChild} />
            ) : (
              <p className="text-sm text-[hsl(var(--ink-muted))]">Select a unit to view details.</p>
            )}
          </div>
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
        title="Organization structure | SIA"
        description="Build the org hierarchy that powers your appraisal cycles."
        path="/org/structure"
      />
      {isOnboarding ? (
        <OnboardingStepFrame
          stepKey="structure"
          eyebrow="Organization"
          title="Build your organization"
          subtitle="Create the structure your people and reviews will use."
          statusLabel={
            units.length > 0
              ? `${units.length} ${units.length === 1 ? "unit" : "units"} across ${sortedTypes.length} ${
                  sortedTypes.length === 1 ? "level" : "levels"
                } ready`
              : "Add at least one unit to continue."
          }
          continueLabel="Continue to people"
          caption="You can update your structure later."
        >
          {pageInner}
        </OnboardingStepFrame>
      ) : (
        <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full">{pageInner}</div>
      )}

    </>
  );
};

export default OrgStructure;

