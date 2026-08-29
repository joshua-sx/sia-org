import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

function EmployeeStatusBadge({ status }: { status: Employee["employment_status"] }) {
  const accent = STATUS_COLORS[status];
  // Yellow is too light for foreground text — use its readable ink variant.
  const ink = accent === "--accent-yellow" ? "--accent-yellow-ink" : accent;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `hsl(var(${accent}) / 0.12)`,
        color: `hsl(var(${ink}))`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(var(${ink}))` }} aria-hidden="true" />
      {EMPLOYMENT_STATUS_LABELS[status]}
    </span>
  );
}

function EmployeeActions({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label={`Actions for ${employee.first_name} ${employee.last_name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(employee)}>
          <Pencil className="me-2 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(employee)}>
          <Trash2 className="me-2 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    <div className="overflow-hidden rounded-2xl bg-surface-raised shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-3 border-b border-hairline px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="h-10 ps-9 text-sm"
          />
        </div>
        <p className="text-xs text-ink-muted tabular-nums sm:text-end" role="status" aria-live="polite">
          Showing {filtered.length} of {employees.length}
        </p>
      </div>

      <div className="md:hidden divide-y divide-hairline">
        {filtered.map((e) => {
          const manager = e.manager_id ? managerById[e.manager_id] : null;
          const perLevel = unitsByLevel(e.org_unit_id, ancestry, levels);
          const orgPath = perLevel
            .filter(Boolean)
            .map((u) => u!.name)
            .join(" · ");

          return (
            <div key={e.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {e.first_name} {e.last_name}
                  </p>
                  <p className="text-sm text-ink-muted truncate">{e.email}</p>
                </div>
                <EmployeeActions employee={e} onEdit={onEdit} onDelete={onDelete} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <EmployeeStatusBadge status={e.employment_status} />
                {e.job_title && (
                  <span className="text-ink-muted">{e.job_title}</span>
                )}
              </div>
              {orgPath && (
                <p className="text-xs text-ink-muted">{orgPath}</p>
              )}
              {manager && (
                <p className="text-xs text-ink-muted">
                  Manager: {manager.first_name} {manager.last_name}
                </p>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">No matching employees.</p>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-ink-subtle">
              <th className="px-5 py-3 text-start font-medium">Person</th>
              <th className="px-4 py-3 text-start font-medium">Role</th>
              {levels.map((lvl) => (
                <th key={lvl.type.id} className="px-4 py-3 text-start font-medium">
                  {lvl.type.name}
                </th>
              ))}
              <th className="px-4 py-3 text-start font-medium">Manager</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const manager = e.manager_id ? managerById[e.manager_id] : null;
              const perLevel = unitsByLevel(e.org_unit_id, ancestry, levels);

              return (
                <tr key={e.id} className="border-b border-hairline transition-colors duration-150 last:border-b-0 hover:bg-ink-strong/[0.025]">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{e.first_name} {e.last_name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{e.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted">{e.job_title ?? "—"}</td>
                  {perLevel.map((u, i) => (
                    <td key={levels[i].type.id} className="px-4 py-3.5 text-ink-muted">
                      {u ? <span className="text-foreground">{u.name}</span> : "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-ink-muted">
                    {manager ? `${manager.first_name} ${manager.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <EmployeeStatusBadge status={e.employment_status} />
                  </td>
                  <td className="px-2 py-3.5">
                    <EmployeeActions employee={e} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6 + levels.length} className="px-4 py-10 text-center text-sm text-ink-muted">
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
