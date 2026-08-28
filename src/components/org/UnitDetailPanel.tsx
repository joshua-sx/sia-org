import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgUnitTreeNode } from "@/hooks/useOrgUnits";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { Pencil, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/siaErrors";

interface Props {
  node: OrgUnitTreeNode;
  onAddChild: (parentNode: OrgUnitTreeNode) => void;
}

const UnitDetailPanel = ({ node, onAddChild }: Props) => {
  const { updateUnit } = useOrgUnits();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const childCount = node.children.length;
  const isInactive = node.is_active === false;

  const saveName = async () => {
    if (!newName.trim() || newName.trim() === node.name) {
      setEditing(false);
      return;
    }
    try {
      await updateUnit.mutateAsync({ id: node.id, name: newName.trim() });
      toast.success("Unit renamed");
      setEditing(false);
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to rename"));
    }
  };

  const deactivate = async () => {
    if (childCount > 0) {
      const confirmed = window.confirm(
        `This unit has ${childCount} child unit(s). Deactivating will not remove them — they will appear as unassigned. Continue?`
      );
      if (!confirmed) return;
    }
    try {
      await updateUnit.mutateAsync({ id: node.id, is_active: false });
      toast.success("Unit deactivated");
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to deactivate"));
    }
  };

  const reactivate = async () => {
    try {
      await updateUnit.mutateAsync({ id: node.id, is_active: true });
      toast.success("Unit reactivated");
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to reactivate"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {editing ? (
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={saveName}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setNewName(node.name); }}>Cancel</Button>
          </div>
        ) : (
          <h2 className="text-xl font-bold tracking-tight">{node.name}</h2>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{node.typeName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Parent</span>
          <p className="font-medium">{node.parent_id ? "—" : "Top-level unit"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Children</span>
          <p className="font-medium">{childCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Status</span>
          <p className={`font-medium ${isInactive ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
            {isInactive ? "Inactive" : "Active"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isInactive && (
          <>
            <Button variant="outline" size="sm" onClick={() => { setNewName(node.name); setEditing(true); }}>
              <Pencil className="mr-1 h-3 w-3" /> Edit name
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddChild(node)}>
              <Plus className="mr-1 h-3 w-3" /> Add child unit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={deactivate}>
              <XCircle className="mr-1 h-3 w-3" /> Deactivate
            </Button>
          </>
        )}
        {isInactive && (
          <Button variant="outline" size="sm" onClick={reactivate}>
            Reactivate
          </Button>
        )}
      </div>
    </div>
  );
};

export default UnitDetailPanel;
