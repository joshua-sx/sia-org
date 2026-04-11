import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, X } from "lucide-react";

interface Props {
  levels: string[];
  onChange: (levels: string[]) => void;
}

const CustomLevelBuilder = ({ levels, onChange }: Props) => {
  const [newLevel, setNewLevel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addLevel = () => {
    const trimmed = newLevel.trim();
    if (!trimmed || levels.length >= 5 || levels.includes(trimmed)) return;
    onChange([...levels, trimmed]);
    setNewLevel("");
  };

  const removeLevel = (idx: number) => {
    onChange(levels.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const copy = [...levels];
    const [item] = copy.splice(dragIdx, 1);
    copy.splice(dropIdx, 0, item);
    onChange(copy);
    setDragIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {levels.map((level, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className="flex items-center gap-2 rounded-md border bg-card p-2"
          >
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">{level}</span>
            <span className="text-xs text-muted-foreground">Level {idx + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLevel(idx)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {levels.length < 5 && (
        <div className="flex gap-2">
          <Input
            placeholder="Level name (e.g. Region)"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLevel()}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addLevel} disabled={!newLevel.trim()}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
      )}

      {levels.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Preview: {levels.join(" → ")}
        </p>
      )}
    </div>
  );
};

export default CustomLevelBuilder;
