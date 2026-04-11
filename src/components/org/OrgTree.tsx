import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, Folder } from "lucide-react";
import { OrgUnitTreeNode } from "@/hooks/useOrgUnits";

interface Props {
  nodes: OrgUnitTreeNode[];
  selectedId: string | null;
  onSelect: (node: OrgUnitTreeNode) => void;
}

const TreeNode = ({
  node,
  selectedId,
  onSelect,
  level = 0,
}: {
  node: OrgUnitTreeNode;
  selectedId: string | null;
  onSelect: (node: OrgUnitTreeNode) => void;
  level?: number;
}) => {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isInactive = node.is_active === false;

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
          isSelected ? "bg-accent font-medium" : ""
        } ${isInactive ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            className="p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {open && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{node.typeName}</span>
      </div>
      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} level={level + 1} />
        ))}
    </div>
  );
};

const OrgTree = ({ nodes, selectedId, onSelect }: Props) => (
  <div className="space-y-0.5">
    {nodes.map((node) => (
      <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} />
    ))}
  </div>
);

export default OrgTree;
