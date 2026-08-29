import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrgTree from "@/components/org/OrgTree";
import type { OrgUnitTreeNode } from "@/hooks/useOrgUnits";

const baseUnit = {
  organization_id: "org-1",
  unit_type_id: "type-1",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const nodes: OrgUnitTreeNode[] = [
  {
    ...baseUnit,
    id: "company",
    parent_id: null,
    name: "SIA",
    depth: 0,
    typeName: "Company",
    typeLevel: 0,
    children: [
      {
        ...baseUnit,
        id: "people",
        parent_id: "company",
        name: "People",
        depth: 1,
        typeName: "Department",
        typeLevel: 1,
        children: [],
      },
    ],
  },
];

describe("OrgTree keyboard accessibility", () => {
  it("supports the tree arrow-key navigation pattern", () => {
    render(<OrgTree nodes={nodes} selectedId="company" onSelect={vi.fn()} />);

    const [company, people] = screen.getAllByRole("treeitem");
    company.focus();

    fireEvent.keyDown(company, { key: "ArrowRight" });
    expect(people).toHaveFocus();

    fireEvent.keyDown(people, { key: "ArrowLeft" });
    expect(company).toHaveFocus();

    fireEvent.keyDown(company, { key: "End" });
    expect(people).toHaveFocus();

    fireEvent.keyDown(people, { key: "Home" });
    expect(company).toHaveFocus();
  });

  it("exposes expansion on the tree item and keeps the pointer toggle out of tab order", () => {
    render(<OrgTree nodes={nodes} selectedId="company" onSelect={vi.fn()} />);

    const company = screen.getByRole("treeitem", { name: /SIA/i });
    const toggle = screen.getByRole("button", { name: "Collapse SIA" });

    expect(company).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(company, { key: "ArrowLeft" });
    expect(company).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("treeitem", { name: /People/i })).not.toBeInTheDocument();
  });
});
