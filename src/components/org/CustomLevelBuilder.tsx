import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  levels: string[];
  onChange: (levels: string[]) => void;
}

const LEVEL_DOT_VARS = [
  "--accent-blue",
  "--accent-green",
  "--accent-yellow",
  "--accent-red",
  "270 70% 60%", // violet fallback
] as const;

const dotStyle = (i: number) => {
  const v = LEVEL_DOT_VARS[i % LEVEL_DOT_VARS.length];
  return { backgroundColor: v.startsWith("--") ? `hsl(var(${v}))` : `hsl(${v})` };
};

const CustomLevelBuilder = ({ levels, onChange }: Props) => {
  const [newLevel, setNewLevel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const atMax = levels.length >= 5;

  const addLevel = () => {
    const trimmed = newLevel.trim();
    if (!trimmed || atMax || levels.includes(trimmed)) return;
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
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-card p-4 space-y-4">
      {/* Level rows */}
      <div className="space-y-2 min-h-[3rem]">
        {levels.length === 0 ? (
          <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--hairline))] text-sm text-muted-foreground">
            Add your first level below to get started
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {levels.map((level, idx) => (
              <motion.div
                key={level}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                draggable={levels.length > 1}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className="group flex h-12 items-center gap-3 rounded-lg border border-[hsl(var(--hairline))] bg-background px-3"
              >
                <GripVertical
                  className={`h-4 w-4 text-muted-foreground ${
                    levels.length > 1 ? "cursor-grab active:cursor-grabbing" : "opacity-40"
                  }`}
                />
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={dotStyle(idx)}
                  aria-hidden
                />
                <span className="flex-1 text-[15px] font-medium text-foreground truncate">
                  {level}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  Level {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLevel(idx)}
                  aria-label={`Remove ${level}`}
                  className="ml-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[hsl(var(--ink-strong)/0.05)] hover:text-foreground active:scale-[0.96] [transition-property:transform,background-color,color] duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add input */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            placeholder="Add a level (e.g. Region, Team, Squad)"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLevel();
              }
            }}
            disabled={atMax}
            className="h-11 flex-1 rounded-lg border-[hsl(var(--hairline))] bg-background text-[15px] placeholder:text-muted-foreground/70 focus-visible:ring-[hsl(var(--accent-blue)/0.35)]"
          />
          <Button
            onClick={addLevel}
            disabled={!newLevel.trim() || atMax}
            className="h-11 rounded-lg px-4 bg-[hsl(var(--accent-blue))] text-white hover:bg-[hsl(var(--accent-blue)/0.92)] active:scale-[0.96] [transition-property:transform,background-color] duration-150"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-[11px] tabular-nums text-muted-foreground pl-1">
          {atMax ? "Maximum 5 levels reached" : `${levels.length}/5 levels`}
        </p>
      </div>
    </div>
  );
};

export default CustomLevelBuilder;
