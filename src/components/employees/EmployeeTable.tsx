import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Employee } from "@/hooks/useEmployees";
import { EMPLOYMENT_STATUS_LABELS } from "@/lib/employeeSchema";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { buildAncestryMap, orderedLevels, unitsByLevel } from "@/lib/orgHierarchy";

interface Props {
  employees: Employee[];
  /** Kept for API compatibility; not used since ancestry is derived internally. */
  unitsById?: Record<string, string>;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

const STATUS_COLORS: Record<Employee["employment_status"], string> = {
  active: "--accent-green",
  on_leave: "--accent-yellow",
  terminated: "--accent-red",
};

export function EmployeeTable({ employees, onEdit, onDelete }: Props) {
  const [q, setQ] = useState("");
  const { data: units = [] } = useOrgUnits();
  const { data: types = [] } = useOrgUnitTypes();

  const levels = useMemo(() => orderedLevels(types), [types]);
  const ancestry = useMemo(() => buildAncestryMap(units), [units]);

  const managerById = useMemo(() => {
    const m: Record<string, Employee> = {};
    employees.forEach((e) => (m[e.id] = e));
    return m;
  }, [employees]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((e) =>
      `${e.first_name} ${e.last_name} ${e.email} ${e.job_title ?? ""}`.toLowerCase().includes(needle)
    );
  }, [employees, q]);

  return (
    <div className="rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[hsl(var(--hairline))]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--ink-subtle))]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="h-9 pl-9 text-sm"
          />
        </div>
        <p className="text-xs text-[hsl(var(--ink-muted))] tabular-nums">
          {filtered.length} of {employees.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--hairline))] text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
              <th className="text-left px-4 py-2.5 font-medium">First name</th>
              <th className="text-left px-4 py-2.5 font-medium">Last name</th>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Job title</th>
              {levels.map((lvl) => (
                <th key={lvl.type.id} className="text-left px-4 py-2.5 font-medium">
                  {lvl.type.name}
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-medium">Manager</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const manager = e.manager_id ? managerById[e.manager_id] : null;
              const perLevel = unitsByLevel(e.org_unit_id, ancestry, levels);

              return (
                <tr key={e.id} className="border-b border-[hsl(var(--hairline))] last:border-b-0 hover:bg-[hsl(var(--ink-strong)/0.02)]">
                  <td className="px-4 py-3 font-medium text-foreground">{e.first_name}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.last_name}</td>
                  <td className="px-4 py-3 text-[hsl(var(--ink-muted))]">{e.email}</td>
                  <td className="px-4 py-3 text-[hsl(var(--ink-muted))]">{e.job_title ?? "—"}</td>
                  {perLevel.map((u, i) => (
                    <td key={levels[i].type.id} className="px-4 py-3 text-[hsl(var(--ink-muted))]">
                      {u ? <span className="text-foreground">{u.name}</span> : "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-[hsl(var(--ink-muted))]">
                    {manager ? `${manager.first_name} ${manager.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `hsl(var(${STATUS_COLORS[e.employment_status]}) / 0.12)`,
                        color: `hsl(var(${STATUS_COLORS[e.employment_status]}))`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: `hsl(var(${STATUS_COLORS[e.employment_status]}))` }}
                      />
                      {EMPLOYMENT_STATUS_LABELS[e.employment_status]}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(e)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(e)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7 + levels.length} className="px-4 py-8 text-center text-sm text-[hsl(var(--ink-muted))]">
                  No matching employees.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeTable;
