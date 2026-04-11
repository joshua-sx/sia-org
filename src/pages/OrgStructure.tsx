import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Upload, Settings2, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { useOrgUnits, buildTree, OrgUnitTreeNode } from "@/hooks/useOrgUnits";
import SetupWizard from "@/components/org/SetupWizard";
import OrgTree from "@/components/org/OrgTree";
import UnitDetailPanel from "@/components/org/UnitDetailPanel";
import AddUnitModal from "@/components/org/AddUnitModal";
import CsvImportModal from "@/components/org/CsvImportModal";
import EditLevelsModal from "@/components/org/EditLevelsModal";

const OrgStructure = () => {
  const { profile } = useAuth();
  const { data: unitTypes = [], isLoading: loadingTypes } = useOrgUnitTypes();
  const { data: units = [], isLoading: loadingUnits } = useOrgUnits();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [showEditLevels, setShowEditLevels] = useState(false);
  const [addParent, setAddParent] = useState<OrgUnitTreeNode | null>(null);
  const [addTypeId, setAddTypeId] = useState<string>("");
  const [wizardDone, setWizardDone] = useState(false);

  const isNotAdmin = profile && profile.role !== "hr_admin";
  const loading = loadingTypes || loadingUnits;
  const hasTypes = unitTypes.length > 0;
  const showWizard = !loading && !hasTypes && !wizardDone;

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
          <h1 className="text-2xl font-bold tracking-tight text-[#2c2c2b]">Access restricted</h1>
          <p className="mt-2 text-sm text-[#7d7a75]">This area is for HR Administrators only.</p>
          <Button asChild variant="ghost" className="mt-6 gap-2 text-[#7d7a75]">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (showWizard) {
    return <SetupWizard onComplete={() => setWizardDone(true)} />;
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#7d7a75]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#2c2c2b] font-[Space_Grotesk]">
            Organization Structure
          </h1>
          <p className="mt-1 text-sm text-[#7d7a75]">
            {sortedTypes.map((t) => t.name).join(" → ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditLevels(true)} className="border-[rgba(0,0,0,0.1)]">
            <Settings2 className="mr-1 h-3 w-3" /> Edit levels
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCsv(true)} className="border-[rgba(0,0,0,0.1)]">
            <Upload className="mr-1 h-3 w-3" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => { setAddParent(null); setAddTypeId(""); setShowAdd(true); }}>
            <Plus className="mr-1 h-3 w-3" /> Add unit
          </Button>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-12 w-12 text-[#c4c1bc]" />
          <div>
            <h2 className="text-lg font-semibold text-[#2c2c2b]">Your hierarchy is configured</h2>
            <p className="text-sm text-[#7d7a75]">
              Add your first {topLevelType?.name ?? "unit"}.
            </p>
          </div>
          <Button onClick={() => { setAddParent(null); setAddTypeId(topLevelType?.id ?? ""); setShowAdd(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Add {topLevelType?.name ?? "unit"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
            <OrgTree nodes={tree} selectedId={selectedId} onSelect={(n) => setSelectedId(n.id)} />
          </div>
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-5">
            {selectedNode ? (
              <UnitDetailPanel node={selectedNode} onAddChild={handleAddChild} />
            ) : (
              <p className="text-sm text-[#7d7a75]">Select a unit to view details.</p>
            )}
          </div>
        </div>
      )}

      <AddUnitModal open={showAdd} onOpenChange={setShowAdd} unitTypes={unitTypes} units={units} preselectedParent={addParent} preselectedTypeId={addTypeId} />
      <CsvImportModal open={showCsv} onOpenChange={setShowCsv} unitTypes={unitTypes} units={units} />
      <EditLevelsModal open={showEditLevels} onOpenChange={setShowEditLevels} unitTypes={unitTypes} hasUnits={units.length > 0} />
    </div>
  );
};

export default OrgStructure;
