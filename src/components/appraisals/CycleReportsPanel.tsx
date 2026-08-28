import { useMemo, useState } from "react";
import { BellRing, Download, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Employee } from "@/hooks/useEmployees";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import { useAuth } from "@/contexts/AuthContext";
import { exportParticipantPdf } from "@/lib/appraisalRecord";
import type { ParticipantGoalWeight } from "@/lib/cycleParticipantData";
import {
  buildCycleCompletionSummary,
  buildManagerReports,
  buildOverdueTasks,
  buildParticipantReports,
  exportCycleCompletionCsv,
  exportEmployeeStatusCsv,
  exportManagerCompletionCsv,
  exportOverdueTasksCsv,
  filterParticipantRows,
  statusLabel,
  type ParticipantReportRow,
  type StatusFilter,
  type TaskStatus,
} from "@/lib/cycleReports";
import {
  CYCLE_NUDGE_TASK_LABELS,
  type CycleTaskKind,
} from "@/lib/cycleTasks";
import { buildAncestryMap, unitBreadcrumb } from "@/lib/orgHierarchy";
import { friendlyError } from "@/lib/siaErrors";
import { useCycleNudges } from "@/hooks/useCycleNudges";

const STATUS_CHIP: Record<TaskStatus, string> = {
  complete: "text-accent-green bg-accent-green/[0.1]",
  pending: "text-accent-blue bg-accent-blue/[0.1]",
  overdue: "text-accent-red bg-accent-red/[0.1]",
  frozen: "text-ink-subtle bg-hairline/[0.5]",
  not_due: "text-ink-subtle bg-hairline/[0.35]",
};

function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_CHIP[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

interface Props {
  cycle: AppraisalCycle;
  participants: CycleParticipant[];
  goalWeights: ParticipantGoalWeight[];
  employees: Employee[];
  units: OrgUnit[];
}

export function CycleReportsPanel({ cycle, participants, goalWeights, employees, units }: Props) {
  const { organization, profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [nudgingKey, setNudgingKey] = useState<string | null>(null);
  const { cooldownUntil, sendNudge } = useCycleNudges(cycle.id);
  const canNudge = profile?.role === "hr_admin" && cycle.status === "active";

  const unitByEmployeeId = useMemo(() => {
    const ancestry = buildAncestryMap(units);
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.org_unit_id) map.set(e.id, unitBreadcrumb(e.org_unit_id, ancestry));
    });
    return map;
  }, [employees, units]);

  const reportRows = useMemo(
    () => buildParticipantReports(participants, goalWeights, cycle, unitByEmployeeId),
    [participants, goalWeights, cycle, unitByEmployeeId],
  );

  const summary = useMemo(() => buildCycleCompletionSummary(cycle, reportRows), [cycle, reportRows]);
  const managerReports = useMemo(() => buildManagerReports(reportRows), [reportRows]);
  const overdueTasks = useMemo(() => buildOverdueTasks(reportRows, cycle), [reportRows, cycle]);

  const managers = useMemo(() => {
    const seen = new Map<string, string>();
    reportRows.forEach((r) => seen.set(r.managerId, r.managerName));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [reportRows]);

  const filteredRows = useMemo(() => {
    let rows = filterParticipantRows(reportRows, statusFilter);
    if (managerFilter !== "all") {
      rows = rows.filter((r) => r.managerId === managerFilter);
    }
    return rows;
  }, [reportRows, statusFilter, managerFilter]);

  const handlePdfExport = async (participant: CycleParticipant) => {
    if (!organization?.name) return;
    setExportingPdfId(participant.id);
    try {
      await exportParticipantPdf(organization.name, cycle, participant);
    } catch (err) {
      toast.error(friendlyError(err, "Could not export PDF"));
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleNudge = async (participantId: string, taskKind: CycleTaskKind, who: string) => {
    setNudgingKey(`${participantId}:${taskKind}`);
    try {
      await sendNudge({ participantId, taskKind });
      toast.success(`Reminder sent to ${who}`);
    } catch (err) {
      toast.error(friendlyError(err, "Could not send the reminder"));
    } finally {
      setNudgingKey(null);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-hairline bg-surface-raised overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-hairline">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cycle status &amp; exports</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Track who's late, export CSV reports, or save individual appraisal records as PDF.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Reports</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => exportCycleCompletionCsv(cycle, summary)}>
              Completion summary
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportEmployeeStatusCsv(cycle, reportRows)}>
              Employee status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportManagerCompletionCsv(cycle, managerReports)}>
              Manager completion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportOverdueTasksCsv(cycle, overdueTasks)}>
              Overdue tasks ({overdueTasks.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 border-b border-hairline">
        <Stat label="Participants" value={summary.totalParticipants} />
        <Stat label="Overdue" value={summary.overdueParticipants} accent="red" />
        <Stat label="Acknowledged" value={`${summary.acknowledged}/${summary.totalParticipants}`} />
        <Stat label="Completion" value={`${summary.completionPct}%`} accent="green" />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-hairline bg-surface-raised">
        <Filter className="h-3.5 w-3.5 text-ink-subtle" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All participants</SelectItem>
            <SelectItem value="overdue">Overdue only</SelectItem>
            <SelectItem value="pending">Pending tasks</SelectItem>
            <SelectItem value="complete">Fully complete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All managers</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-ink-subtle tabular-nums">
          {filteredRows.length} shown
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-ink-subtle">
              <th className="px-5 py-2.5 font-medium">Employee</th>
              <th className="px-3 py-2.5 font-medium">Manager</th>
              <th className="px-3 py-2.5 font-medium">Goals</th>
              <th className="px-3 py-2.5 font-medium">Interim</th>
              <th className="px-3 py-2.5 font-medium">Final</th>
              <th className="px-3 py-2.5 font-medium">Ack</th>
              {canNudge && <th className="px-3 py-2.5 font-medium">Remind</th>}
              <th className="px-5 py-2.5 font-medium text-right">Record</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={canNudge ? 8 : 7}
                  className="px-5 py-8 text-center text-sm text-ink-muted"
                >
                  No participants match this filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const participant = participants.find((p) => p.id === row.participantId);
                const canExport = !!participant?.final_submitted_at;
                return (
                  <tr key={row.participantId} className={row.frozen ? "opacity-60" : undefined}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{row.employeeName}</p>
                      <p className="text-xs text-ink-subtle truncate max-w-[200px]">
                        {row.unit || row.jobTitle || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{row.managerName}</td>
                    <td className="px-3 py-3">
                      <StatusChip status={row.goals} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={row.interim} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={row.final} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={row.acknowledgement} />
                    </td>
                    {canNudge && (
                      <td className="px-3 py-3">
                        <NudgeCell
                          row={row}
                          cooldownUntil={cooldownUntil}
                          busyKey={nudgingKey}
                          onNudge={handleNudge}
                        />
                      </td>
                    )}
                    <td className="px-5 py-3 text-right">
                      {participant && canExport ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={exportingPdfId === participant.id}
                          onClick={() => void handlePdfExport(participant)}
                        >
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          {exportingPdfId === participant.id ? "Opening…" : "PDF"}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-ink-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * A reminder only makes sense for work that is actually late, so the cell is
 * driven off the row's overdue tasks. Goals/interim/final chase the manager;
 * acknowledgement chases the employee.
 */
function NudgeCell({
  row,
  cooldownUntil,
  busyKey,
  onNudge,
}: {
  row: ParticipantReportRow;
  cooldownUntil: (participantId: string, taskKind: CycleTaskKind) => Date | null;
  busyKey: string | null;
  onNudge: (participantId: string, taskKind: CycleTaskKind, who: string) => Promise<void>;
}) {
  const tasks = row.frozen ? [] : row.overdueTasks;

  if (tasks.length === 0) {
    return <span className="text-[11px] text-ink-subtle">—</span>;
  }

  const recipientFor = (task: CycleTaskKind) =>
    task === "acknowledgement" ? row.employeeName : row.managerName;

  if (tasks.length === 1) {
    const task = tasks[0];
    const until = cooldownUntil(row.participantId, task);
    const busy = busyKey === `${row.participantId}:${task}`;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-accent-red hover:bg-accent-red/[0.1] hover:text-accent-red"
        disabled={busy || !!until}
        title={
          until
            ? `Already reminded — you can send another after ${until.toLocaleString()}`
            : `Remind ${recipientFor(task)} about ${CYCLE_NUDGE_TASK_LABELS[task].toLowerCase()}`
        }
        onClick={() => void onNudge(row.participantId, task, recipientFor(task))}
      >
        <BellRing className="mr-1 h-3.5 w-3.5" />
        {busy ? "Sending…" : until ? "Sent" : "Remind"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-accent-red hover:bg-accent-red/[0.1] hover:text-accent-red"
        >
          <BellRing className="mr-1 h-3.5 w-3.5" />
          Remind ({tasks.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Overdue tasks</DropdownMenuLabel>
        {tasks.map((task) => {
          const until = cooldownUntil(row.participantId, task);
          return (
            <DropdownMenuItem
              key={task}
              disabled={!!until}
              onClick={() => void onNudge(row.participantId, task, recipientFor(task))}
            >
              <span className="flex-1">{CYCLE_NUDGE_TASK_LABELS[task]}</span>
              <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-subtle">
                {until ? "Sent" : recipientFor(task).split(" ")[0]}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "red" | "green";
}) {
  const colorClass =
    accent === "red"
      ? "text-accent-red"
      : accent === "green"
        ? "text-accent-green"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-hairline bg-background px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

export default CycleReportsPanel;
