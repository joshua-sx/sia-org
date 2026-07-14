import { useMemo, useState } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { PanelNotice } from "@/components/appraisals/PanelNotice";

export function DraftLaunchPanel({
  cycleId,
  hasActiveCycle,
  onLaunch,
  launching,
}: {
  cycleId: string;
  hasActiveCycle: boolean;
  onLaunch: (participants: Array<{ employee_id: string; manager_id: string }>) => Promise<void>;
  launching: boolean;
}) {
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEmployees();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [managerOverrides, setManagerOverrides] = useState<Record<string, string>>({});

  const candidates = useMemo(
    () => employees.filter((e) => e.employment_status === "active"),
    [employees],
  );

  const managerFor = (e: Employee) => managerOverrides[e.id] ?? e.manager_id ?? null;
  const included = candidates.filter((e) => !excluded.has(e.id));
  const unmanaged = included.filter((e) => !managerFor(e));
  const canLaunch = !hasActiveCycle && included.length > 0 && unmanaged.length === 0;

  const toggleExcluded = (employeeId: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[hsl(var(--hairline))]">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Participants</h2>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))]">
            <span className="tabular-nums">{included.length}</span> of{" "}
            <span className="tabular-nums">{candidates.length}</span> active employees included
            {excluded.size > 0 && <> · {excluded.size} excluded</>}
          </p>
        </div>
        <Button
          onClick={() =>
            onLaunch(
              included.map((e) => ({
                employee_id: e.id,
                manager_id: managerFor(e) as string,
              })),
            )
          }
          disabled={!canLaunch || launching}
        >
          <Rocket className="mr-1.5 h-4 w-4" />
          {launching ? "Launching…" : "Launch cycle"}
        </Button>
      </div>

      {hasActiveCycle && (
        <PanelNotice text="Another cycle is already active. Complete it before launching this one." />
      )}
      {!hasActiveCycle && unmanaged.length > 0 && (
        <PanelNotice
          text={`${unmanaged.length} included ${unmanaged.length === 1 ? "employee has" : "employees have"} no manager. Assign one below or exclude them — a cycle can't launch with unmanaged participants.`}
        />
      )}

      {isLoading ? (
        <div className="px-5 py-6">
          <QueryLoading label="Loading employees" rows={4} />
        </div>
      ) : isError ? (
        <div className="px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      ) : candidates.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[hsl(var(--ink-muted))]">
          No active employees to include. Add employees first.
        </p>
      ) : (
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {candidates.map((e) => {
            const isExcluded = excluded.has(e.id);
            const managerId = managerFor(e);
            const managerOptions = candidates.filter((m) => m.id !== e.id);
            return (
              <div key={e.id} className={`flex items-center gap-4 px-5 py-3 ${isExcluded ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {e.first_name} {e.last_name}
                  </p>
                  <p className="text-xs text-[hsl(var(--ink-subtle))] truncate">
                    {e.job_title || e.email}
                  </p>
                </div>
                <div className="w-52 shrink-0">
                  <Select
                    value={managerId ?? undefined}
                    onValueChange={(v) => setManagerOverrides((prev) => ({ ...prev, [e.id]: v }))}
                    disabled={isExcluded}
                  >
                    <SelectTrigger
                      className={`h-8 text-xs ${!managerId && !isExcluded ? "border-[hsl(var(--accent-yellow))]" : ""}`}
                    >
                      <SelectValue placeholder="Assign manager…" />
                    </SelectTrigger>
                    <SelectContent>
                      {managerOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No other employees available — add another employee to assign a manager.
                        </div>
                      ) : (
                        managerOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.first_name} {m.last_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-24 shrink-0 items-center justify-end gap-2">
                  <span className="text-[11px] text-[hsl(var(--ink-subtle))]">
                    {isExcluded ? "Excluded" : "Included"}
                  </span>
                  <Switch checked={!isExcluded} onCheckedChange={() => toggleExcluded(e.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
