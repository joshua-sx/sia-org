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

  const moveFocus = (current: HTMLElement, offset: number | "first" | "last") => {
    const tree = current.closest('[role="tree"]');
    const items = tree ? Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')) : [];
    const index = items.indexOf(current);
    const nextIndex = offset === "first"
      ? 0
      : offset === "last"
        ? items.length - 1
        : Math.min(Math.max(index + offset, 0), items.length - 1);
    items[nextIndex]?.focus();
  };

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
    if (e.key === "ArrowRight" && hasChildren && open) {
      e.preventDefault();
      const firstChild = e.currentTarget.parentElement?.querySelector<HTMLElement>(
        ':scope > [role="group"] > [role="none"] > [role="treeitem"]',
      );
      firstChild?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && hasChildren && open) {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const parentItem = e.currentTarget.parentElement?.parentElement?.closest('[role="none"]')?.querySelector<HTMLElement>(
        ':scope > [role="treeitem"]',
      );
      parentItem?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(e.currentTarget, 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(e.currentTarget, -1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      moveFocus(e.currentTarget, "first");
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      moveFocus(e.currentTarget, "last");
    }
  };

  return (
    <div role="none">
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? open : undefined}
        aria-level={level + 1}
        tabIndex={isTabStop ? 0 : -1}
        className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg pe-2.5 text-sm transition-[background-color,color,box-shadow] duration-150 hover:bg-ink-strong/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
          isSelected ? "bg-accent-red/[0.08] font-medium text-foreground ring-1 ring-inset ring-accent-red/[0.12]" : "text-ink-muted"
        } ${isInactive ? "opacity-50" : ""}`}
        style={{ paddingInlineStart: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
        onKeyDown={handleRowKeyDown}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors duration-150 hover:bg-ink-strong/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-5" aria-hidden />
        )}
        {open && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-accent-red" strokeWidth={1.75} aria-hidden />
        ) : (
          <Folder className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} aria-hidden />
        )}
        <span className="truncate">{node.name}</span>
        <span className="ms-auto shrink-0 rounded-full bg-ink-strong/[0.045] px-2 py-0.5 text-[11px] font-normal text-ink-muted">{node.typeName}</span>
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
