import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UnitNode } from "./AccordionBuilder";

const LEVEL_COLORS = [
  { dot: "bg-primary", text: "text-primary" },
  { dot: "bg-green-500", text: "text-green-600" },
  { dot: "bg-violet-500", text: "text-violet-600" },
  { dot: "bg-amber-500", text: "text-amber-600" },
  { dot: "bg-rose-500", text: "text-rose-600" },
];

const LevelDot = ({ depth }: { depth: number }) => {
  const c = LEVEL_COLORS[depth % LEVEL_COLORS.length];
  if (depth === 2) return <div className={`h-2 w-2 ${c.dot} rotate-45 shrink-0`} />;
  return <div className={`h-2 w-2 ${c.dot} ${depth === 1 ? "rounded-full" : "rounded-[2px]"} shrink-0`} />;
};

interface TreeNodeProps {
  name: string;
  depth: number;
  children: UnitNode[];
  isLast: boolean;
  prefix: string;
  levelName: string;
}

const TreeNode = ({ name, depth, children, isLast, prefix, levelName }: TreeNodeProps) => {
  const connector = isLast ? "└" : "├";
  const pipe = isLast ? "   " : "│  ";

  return (
    <div>
      <div className="flex items-center gap-2 py-0.5">
        {depth > 0 && (
          <span className="text-xs text-muted-foreground font-mono whitespace-pre">
            {prefix}{connector}─
          </span>
        )}
        <LevelDot depth={depth} />
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-[10px] text-muted-foreground">{levelName}</span>
      </div>
      {children.map((child, i) => (
        <TreeNode
          key={i}
          name={child.name}
          depth={depth + 1}
          children={child.children}
          isLast={i === children.length - 1}
          prefix={depth > 0 ? prefix + pipe : ""}
          levelName={levelName}
        />
      ))}
    </div>
  );
};

interface TreePreviewProps {
  units: UnitNode[];
  levels: string[];
  onClose: () => void;
}

const flattenForPreview = (
  nodes: UnitNode[],
  depth: number,
  levels: string[]
): { name: string; depth: number; levelName: string; children: UnitNode[] }[] => {
  // We render hierarchically, not flattened
  return [];
};

const TreePreview = ({ units, levels, onClose }: TreePreviewProps) => {
  const hasData = units.length > 0;

  const renderTreeNode = (
    node: UnitNode,
    depth: number,
    isLast: boolean,
    prefix: string
  ): React.ReactNode => {
    const connector = isLast ? "└" : "├";
    const pipe = isLast ? "   " : "│  ";
    const levelName = levels[depth] || "";

    return (
      <div key={node.name + depth + prefix}>
        <div className="flex items-center gap-2 py-0.5">
          {depth > 0 && (
            <span className="text-xs text-muted-foreground font-mono whitespace-pre">
              {prefix}{connector}─
            </span>
          )}
          <LevelDot depth={depth} />
          <span className="text-sm font-medium text-foreground">{node.name}</span>
          <span className="text-[10px] text-muted-foreground">{levelName}</span>
        </div>
        {node.children.map((child, i) =>
          renderTreeNode(
            child,
            depth + 1,
            i === node.children.length - 1,
            depth > 0 ? prefix + pipe : ""
          )
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>🌳</span>
          <span className="text-sm font-semibold text-foreground">Hierarchy Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {levels.map((level, i) => (
              <span key={level} className="flex items-center gap-1">
                <LevelDot depth={i} />
                {level}s
              </span>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="font-mono text-sm space-y-0.5">
        {hasData ? (
          units.map((node, i) =>
            renderTreeNode(node, 0, i === units.length - 1, "")
          )
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4 font-sans">
            Add items below to see your org tree here.
          </p>
        )}
      </div>
    </div>
  );
};

export default TreePreview;
