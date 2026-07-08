import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Plus, X, CornerDownRight } from "lucide-react";

// Semantic colors per depth level
const LEVEL_COLORS = [
  { bg: "bg-accent", text: "text-accent-foreground", border: "border-primary/20", dot: "bg-primary" },
  { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
];

export interface UnitNode {
  name: string;
  expanded: boolean;
  children: UnitNode[];
}

interface ChipInputProps {
  placeholder: string;
  onAdd: (name: string) => void;
  autoFocus?: boolean;
  levelIndex: number;
}

const ChipInput = ({ placeholder, onAdd, autoFocus, levelIndex }: ChipInputProps) => {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const submit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
    }
  };

  const colors = LEVEL_COLORS[levelIndex % LEVEL_COLORS.length];

  return (
    <div className={`flex items-center gap-2 rounded-lg border ${colors.border} px-3 py-2 transition-colors focus-within:border-primary`}>
      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="border-0 p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
      />
      {value.trim() && (
        <Button variant="ghost" size="sm" onClick={submit} className="h-6 px-2 text-xs text-primary">
          ↵
        </Button>
      )}
    </div>
  );
};

const LevelDot = ({ levelIndex, size = "h-2 w-2" }: { levelIndex: number; size?: string }) => {
  const colors = LEVEL_COLORS[levelIndex % LEVEL_COLORS.length];
  if (levelIndex === 2) {
    return <div className={`${size} ${colors.dot} rotate-45`} />;
  }
  return <div className={`${size} ${colors.dot} ${levelIndex === 1 ? "rounded-full" : "rounded-[2px]"}`} />;
};

interface AccordionBuilderProps {
  levels: string[];
  units: UnitNode[];
  onUnitsChange: (units: UnitNode[]) => void;
}

const AccordionBuilder = ({ levels, units, onUnitsChange }: AccordionBuilderProps) => {
  const toggleNode = (path: number[]) => {
    const update = (nodes: UnitNode[], indices: number[]): UnitNode[] => {
      return nodes.map((node, i) => {
        if (i === indices[0]) {
          if (indices.length === 1) return { ...node, expanded: !node.expanded };
          return { ...node, children: update(node.children, indices.slice(1)) };
        }
        return node;
      });
    };
    onUnitsChange(update(units, path));
  };

  const addNode = (path: number[], name: string) => {
    const newNode: UnitNode = { name, expanded: true, children: [] };
    if (path.length === 0) {
      onUnitsChange([...units, newNode]);
      return;
    }
    const update = (nodes: UnitNode[], indices: number[]): UnitNode[] => {
      return nodes.map((node, i) => {
        if (i === indices[0]) {
          if (indices.length === 1) {
            return { ...node, children: [...node.children, newNode], expanded: true };
          }
          return { ...node, children: update(node.children, indices.slice(1)) };
        }
        return node;
      });
    };
    onUnitsChange(update(units, path));
  };

  const removeNode = (path: number[]) => {
    if (path.length === 1) {
      onUnitsChange(units.filter((_, i) => i !== path[0]));
      return;
    }
    const update = (nodes: UnitNode[], indices: number[]): UnitNode[] => {
      return nodes.map((node, i) => {
        if (i === indices[0]) {
          if (indices.length === 2) {
            return { ...node, children: node.children.filter((_, j) => j !== indices[1]) };
          }
          return { ...node, children: update(node.children, indices.slice(1)) };
        }
        return node;
      });
    };
    onUnitsChange(update(units, path));
  };

  // Count nodes at each level
  const countAtLevel = (nodes: UnitNode[], depth: number, target: number): number => {
    if (depth === target) return nodes.length;
    return nodes.reduce((sum, n) => sum + countAtLevel(n.children, depth + 1, target), 0);
  };

  const renderNode = (node: UnitNode, depth: number, path: number[]) => {
    const colors = LEVEL_COLORS[depth % LEVEL_COLORS.length];
    const hasChildren = depth < levels.length - 1;
    const childLevel = levels[depth + 1];

    return (
      <div key={path.join("-")} className="animate-fade-in">
        {/* Node header */}
        {hasChildren ? (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all hover:shadow-sm ${
              node.expanded ? colors.border + " " + colors.bg : "border-border bg-card"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleNode(path)}
              aria-expanded={node.expanded}
              className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  node.expanded ? "rotate-90" : ""
                }`}
                aria-hidden
              />
              <LevelDot levelIndex={depth} />
              <span className="text-sm font-medium text-foreground flex-1 truncate">{node.name}</span>
              <span className="text-xs text-muted-foreground">{levels[depth]}</span>
              {node.children.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {node.children.length}
                </Badge>
              )}
            </button>
            <button
              type="button"
              aria-label={`Remove ${node.name}`}
              onClick={() => removeNode(path)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-40 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 border-border bg-card">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <LevelDot levelIndex={depth} />
              <span className="text-sm font-medium text-foreground flex-1 truncate">{node.name}</span>
              <span className="text-xs text-muted-foreground">{levels[depth]}</span>
            </div>
            <button
              type="button"
              aria-label={`Remove ${node.name}`}
              onClick={() => removeNode(path)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-40 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Children */}
        {hasChildren && node.expanded && (
          <div className="ml-5 mt-1.5 space-y-1.5 border-l-2 border-border/50 pl-4">
            {node.children.map((child, idx) =>
              renderNode(child, depth + 1, [...path, idx])
            )}
            <ChipInput
              placeholder={`Add ${childLevel?.toLowerCase()}...`}
              onAdd={(name) => addNode(path, name)}
              levelIndex={depth + 1}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {levels.map((level, i) => {
            const count = countAtLevel(units, 0, i);
            return (
              <div key={level} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LevelDot levelIndex={i} />
                <span className="font-semibold text-foreground">{count}</span>
                <span>{level}{count !== 1 ? "s" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-level input */}
      <ChipInput
        placeholder={`Add ${levels[0]?.toLowerCase()}...`}
        onAdd={(name) => addNode([], name)}
        autoFocus
        levelIndex={0}
      />

      {/* Accordion tree */}
      <div className="space-y-2">
        {units.map((node, idx) => renderNode(node, 0, [idx]))}
      </div>

      {units.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          Type a {levels[0]?.toLowerCase()} name above and press Enter to get started.
        </p>
      )}
    </div>
  );
};

export default AccordionBuilder;
