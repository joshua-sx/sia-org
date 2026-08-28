import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { toast } from "sonner";
import { friendlyError } from "@/lib/siaErrors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitTypes: OrgUnitType[];
  hasUnits: boolean;
}

const EditLevelsModal = ({ open, onOpenChange, unitTypes, hasUnits }: Props) => {
  const { renameType } = useOrgUnitTypes();
  const [names, setNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const m: Record<string, string> = {};
    unitTypes.forEach((t) => (m[t.id] = t.name));
    setNames(m);
  }, [unitTypes]);

  const sorted = [...unitTypes].sort((a, b) => a.level - b.level);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const t of sorted) {
        const newName = names[t.id]?.trim();
        if (newName && newName !== t.name) {
          await renameType.mutateAsync({ id: t.id, name: newName });
        }
      }
      toast.success("Labels updated");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to update"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit hierarchy levels</DialogTitle>
          <DialogDescription>
            Rename your hierarchy labels. This renames the label only — existing units are not affected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {sorted.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <Label className="w-16 text-xs text-muted-foreground">Level {t.level + 1}</Label>
              <Input
                value={names[t.id] ?? ""}
                onChange={(e) => setNames({ ...names, [t.id]: e.target.value })}
              />
            </div>
          ))}
          {hasUnits && (
            <p className="text-xs text-muted-foreground">
              Levels cannot be added or removed while units exist.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLevelsModal;
