import { useState, type KeyboardEvent } from "react";
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
  isFirstRoot = false,
}: {
  node: OrgUnitTreeNode;
  selectedId: string | null;
  onSelect: (node: OrgUnitTreeNode) => void;
  level?: number;
  isFirstRoot?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isInactive = node.is_active === false;
  const isTabStop = isSelected || (selectedId === null && isFirstRoot);

  const handleRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(node);
      return;
    }
    if (e.key === "ArrowRight" && hasChildren && !open) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === "ArrowLeft" && hasChildren && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div role="none">
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-level={level + 1}
        tabIndex={isTabStop ? 0 : -1}
        className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
          isSelected ? "bg-accent font-medium" : ""
        } ${isInactive ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
        onKeyDown={handleRowKeyDown}
      >
        {hasChildren ? (
          <button
            type="button"
            className="p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
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
          <span className="w-5" aria-hidden />
        )}
        {open && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
        <span className="truncate">{node.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{node.typeName}</span>
      </div>
      {open && hasChildren && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgTree = ({ nodes, selectedId, onSelect }: Props) => (
  <div role="tree" aria-label="Organization units" className="space-y-0.5">
    {nodes.map((node, index) => (
      <TreeNode
        key={node.id}
        node={node}
        selectedId={selectedId}
        onSelect={onSelect}
        isFirstRoot={index === 0}
      />
    ))}
  </div>
);

export default OrgTree;
