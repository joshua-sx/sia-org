import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import { OrgUnit, useOrgUnits } from "@/hooks/useOrgUnits";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitTypes: OrgUnitType[];
  units: OrgUnit[];
  preselectedParent?: OrgUnit | null;
  preselectedTypeId?: string;
}

const AddUnitModal = ({ open, onOpenChange, unitTypes, units, preselectedParent, preselectedTypeId }: Props) => {
  const { addUnit } = useOrgUnits();
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(preselectedTypeId ?? "");
  const [parentId, setParentId] = useState(preselectedParent?.id ?? "");
  const [saving, setSaving] = useState(false);

  // Sort types by level
  const sortedTypes = useMemo(() => [...unitTypes].sort((a, b) => a.level - b.level), [unitTypes]);

  // Get the selected type's level
  const selectedType = sortedTypes.find((t) => t.id === typeId);

  // Filter valid parents: must be one level above
  const validParents = useMemo(() => {
    if (!selectedType) return [];
    const parentLevel = selectedType.level - 1;
    const parentType = sortedTypes.find((t) => t.level === parentLevel);
    if (!parentType) return []; // top-level type, no parents
    return units.filter((u) => u.unit_type_id === parentType.id && u.is_active !== false);
  }, [selectedType, sortedTypes, units]);

  const isTopLevel = selectedType && selectedType.level === sortedTypes[0]?.level;

  const handleSave = async () => {
    if (!name.trim() || !typeId) return;
    if (!isTopLevel && !parentId) return;
    setSaving(true);
    try {
      await addUnit.mutateAsync({
        name: name.trim(),
        unit_type_id: typeId,
        parent_id: isTopLevel ? null : parentId || null,
      });
      toast.success("Unit added");
      setName("");
      setTypeId("");
      setParentId("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Unit name</Label>
            <Input placeholder="e.g. Ministry of Finance" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Unit type</Label>
            <Select value={typeId} onValueChange={(v) => { setTypeId(v); setParentId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {sortedTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {typeId && !isTopLevel && (
            <div className="space-y-2">
              <Label>Parent unit</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>
                  {validParents.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validParents.length === 0 && (
                <p className="text-xs text-destructive">
                  No parent units found. Add a higher-level unit first.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !typeId || (!isTopLevel && !parentId)}>
            {saving ? "Saving…" : "Add unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUnitModal;
