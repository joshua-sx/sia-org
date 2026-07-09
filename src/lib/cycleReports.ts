import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import { todayISO, windowState, type WindowState } from "@/lib/cycleSchema";
import { downloadCsv, rowsToCsv } from "@/lib/csvExport";
import { formatScore } from "@/lib/scoring";

export type TaskKind = "goals" | "interim" | "final" | "acknowledgement";

export type TaskStatus = "complete" | "pending" | "overdue" | "frozen" | "not_due";

export interface CycleWindows {
  goal_window_start: string;
  goal_window_end: string;
  interim_window_start: string;
  interim_window_end: string;
  final_window_start: string;
  final_window_end: string;
  acknowledgement_due: string;
}

export interface ParticipantReportRow {
  participantId: string;
  employeeName: string;
  employeeCode: string;
  jobTitle: string;
  unit: string;
  managerName: string;
  managerId: string;
  frozen: boolean;
  goalWeightSum: number;
  goals: TaskStatus;
  interim: TaskStatus;
  final: TaskStatus;
  acknowledgement: TaskStatus;
  interimScore: number | null;
  finalScore: number | null;
  overallScore: number | null;
  overdueTasks: TaskKind[];
  maxDaysOverdue: number;
}

export interface ManagerReportRow {
  managerId: string;
  managerName: string;
  assigned: number;
  goalsComplete: number;
  interimComplete: number;
  finalComplete: number;
  acknowledged: number;
  overdueCount: number;
}

export interface OverdueTaskRow {
  userName: string;
  role: "Manager" | "Employee";
  employeeName: string;
  taskType: string;
  dueDate: string;
  daysOverdue: number;
  managerName: string;
  unit: string;
}

function personName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name}`.trim();
}

function daysAfter(dueDate: string, today: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function stageTaskStatus(
  done: boolean,
  window: WindowState,
  frozen: boolean,
): TaskStatus {
  if (frozen) return "frozen";
  if (done) return "complete";
  if (window === "closed") return "overdue";
  if (window === "upcoming") return "not_due";
  return "pending";
}

function acknowledgementStatus(
  participant: Pick<CycleParticipant, "final_submitted_at" | "acknowledged_at">,
  acknowledgementDue: string,
  frozen: boolean,
  today: string,
): TaskStatus {
  if (frozen) return "frozen";
  if (participant.acknowledged_at) return "complete";
  if (!participant.final_submitted_at) return "not_due";
  if (today > acknowledgementDue) return "overdue";
  return "pending";
}

export function buildParticipantReports(
  participants: CycleParticipant[],
  goalWeights: Array<{ participant_id: string; weight: number }>,
  windows: CycleWindows,
  unitByEmployeeId: Map<string, string>,
  today = todayISO(),
): ParticipantReportRow[] {
  const weightByParticipant = new Map<string, number>();
  goalWeights.forEach((g) =>
    weightByParticipant.set(g.participant_id, (weightByParticipant.get(g.participant_id) ?? 0) + g.weight),
  );

  const goalWindow = windowState(windows.goal_window_start, windows.goal_window_end, today);
  const interimWindow = windowState(windows.interim_window_start, windows.interim_window_end, today);
  const finalWindow = windowState(windows.final_window_start, windows.final_window_end, today);

  return participants.map((p) => {
    const frozen = p.employee.employment_status === "terminated";
    const goalWeightSum = weightByParticipant.get(p.id) ?? 0;
    const goalsDone = goalWeightSum === 100;

    const goals = stageTaskStatus(goalsDone, goalWindow, frozen);
    const interim = stageTaskStatus(!!p.interim_submitted_at, interimWindow, frozen);
    const finalStage = stageTaskStatus(!!p.final_submitted_at, finalWindow, frozen);
    const acknowledgement = acknowledgementStatus(p, windows.acknowledgement_due, frozen, today);

    const overdueTasks: TaskKind[] = [];
    let maxDaysOverdue = 0;
    const trackOverdue = (kind: TaskKind, status: TaskStatus, dueDate: string) => {
      if (status !== "overdue") return;
      overdueTasks.push(kind);
      maxDaysOverdue = Math.max(maxDaysOverdue, daysAfter(dueDate, today));
    };

    trackOverdue("goals", goals, windows.goal_window_end);
    trackOverdue("interim", interim, windows.interim_window_end);
    trackOverdue("final", finalStage, windows.final_window_end);
    trackOverdue("acknowledgement", acknowledgement, windows.acknowledgement_due);

    return {
      participantId: p.id,
      employeeName: personName(p.employee),
      employeeCode: "",
      jobTitle: p.employee.job_title ?? "",
      unit: unitByEmployeeId.get(p.employee_id) ?? "",
      managerName: personName(p.manager),
      managerId: p.manager_id,
      frozen,
      goalWeightSum,
      goals,
      interim,
      final: finalStage,
      acknowledgement,
      interimScore: p.interim_score,
      finalScore: p.final_score,
      overallScore: p.overall_score,
      overdueTasks,
      maxDaysOverdue,
    };
  });
}

export function activeParticipants(participants: CycleParticipant[]) {
  return participants.filter((p) => p.employee.employment_status !== "terminated");
}

export function buildCycleCompletionSummary(
  cycle: Pick<AppraisalCycle, "name">,
  rows: ParticipantReportRow[],
) {
  const active = rows.filter((r) => !r.frozen);
  const n = active.length;
  const count = (status: TaskStatus) => active.filter((r) => r.goals === status).length;
  const stageCount = (field: "interim" | "final" | "acknowledgement", status: TaskStatus) =>
    active.filter((r) => r[field] === status).length;

  const goalsComplete = active.filter((r) => r.goals === "complete").length;
  const interimComplete = active.filter((r) => r.interim === "complete").length;
  const finalComplete = active.filter((r) => r.final === "complete").length;
  const ackComplete = active.filter((r) => r.acknowledgement === "complete").length;
  const overdue = active.filter((r) => r.overdueTasks.length > 0).length;
  const pending = active.filter(
    (r) =>
      r.goals !== "complete" ||
      r.interim !== "complete" ||
      r.final !== "complete" ||
      r.acknowledgement !== "complete",
  ).length;
  const completionPct = n === 0 ? 0 : Math.round((ackComplete / n) * 100);

  return {
    cycleName: cycle.name,
    totalParticipants: n,
    goalsComplete,
    interimComplete,
    finalComplete,
    acknowledged: ackComplete,
    pendingTasks: pending,
    overdueParticipants: overdue,
    completionPct,
    goalsPending: count("pending") + count("overdue"),
    interimPending: stageCount("interim", "pending") + stageCount("interim", "overdue"),
    finalPending: stageCount("final", "pending") + stageCount("final", "overdue"),
  };
}

export function buildManagerReports(rows: ParticipantReportRow[]): ManagerReportRow[] {
  const byManager = new Map<string, ManagerReportRow>();

  for (const row of rows) {
    if (row.frozen) continue;
    const existing = byManager.get(row.managerId) ?? {
      managerId: row.managerId,
      managerName: row.managerName,
      assigned: 0,
      goalsComplete: 0,
      interimComplete: 0,
      finalComplete: 0,
      acknowledged: 0,
      overdueCount: 0,
    };
    existing.assigned += 1;
    if (row.goals === "complete") existing.goalsComplete += 1;
    if (row.interim === "complete") existing.interimComplete += 1;
    if (row.final === "complete") existing.finalComplete += 1;
    if (row.acknowledgement === "complete") existing.acknowledged += 1;
    if (row.overdueTasks.some((t) => t === "goals" || t === "interim" || t === "final")) {
      existing.overdueCount += 1;
    }
    byManager.set(row.managerId, existing);
  }

  return [...byManager.values()].sort((a, b) => a.managerName.localeCompare(b.managerName));
}

const TASK_LABELS: Record<TaskKind, string> = {
  goals: "Goals",
  interim: "Interim assessment",
  final: "Final assessment",
  acknowledgement: "Acknowledgement",
};

export function buildOverdueTasks(rows: ParticipantReportRow[], windows: CycleWindows): OverdueTaskRow[] {
  const dueByKind: Record<TaskKind, string> = {
    goals: windows.goal_window_end,
    interim: windows.interim_window_end,
    final: windows.final_window_end,
    acknowledgement: windows.acknowledgement_due,
  };

  const out: OverdueTaskRow[] = [];
  const today = todayISO();

  for (const row of rows) {
    if (row.frozen) continue;
    for (const kind of row.overdueTasks) {
      const dueDate = dueByKind[kind];
      const daysOverdue = daysAfter(dueDate, today);
      const isManagerTask = kind !== "acknowledgement";
      out.push({
        userName: isManagerTask ? row.managerName : row.employeeName,
        role: isManagerTask ? "Manager" : "Employee",
        employeeName: row.employeeName,
        taskType: TASK_LABELS[kind],
        dueDate,
        daysOverdue,
        managerName: row.managerName,
        unit: row.unit,
      });
    }
  }

  return out.sort((a, b) => b.daysOverdue - a.daysOverdue || a.employeeName.localeCompare(b.employeeName));
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "pending":
      return "Pending";
    case "overdue":
      return "Overdue";
    case "frozen":
      return "Frozen";
    case "not_due":
      return "Not due";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type StatusFilter = "all" | "overdue" | "pending" | "complete";

export function filterParticipantRows(rows: ParticipantReportRow[], filter: StatusFilter): ParticipantReportRow[] {
  switch (filter) {
    case "all":
      return rows;
    case "overdue":
      return rows.filter((r) => r.overdueTasks.length > 0);
    case "pending":
      return rows.filter(
        (r) =>
          !r.frozen &&
          (r.goals === "pending" ||
            r.interim === "pending" ||
            r.final === "pending" ||
            r.acknowledgement === "pending"),
      );
    case "complete":
      return rows.filter(
        (r) =>
          !r.frozen &&
          r.goals === "complete" &&
          r.interim === "complete" &&
          r.final === "complete" &&
          r.acknowledgement === "complete",
      );
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cycle";
}

export function exportCycleCompletionCsv(
  cycle: Pick<AppraisalCycle, "name">,
  summary: ReturnType<typeof buildCycleCompletionSummary>,
) {
  const csv = rowsToCsv(
    [
      "cycle_name",
      "total_participants",
      "goals_complete",
      "interim_complete",
      "final_complete",
      "acknowledged",
      "pending_participants",
      "overdue_participants",
      "completion_pct",
    ],
    [
      [
        summary.cycleName,
        summary.totalParticipants,
        summary.goalsComplete,
        summary.interimComplete,
        summary.finalComplete,
        summary.acknowledged,
        summary.pendingTasks,
        summary.overdueParticipants,
        summary.completionPct,
      ],
    ],
  );
  downloadCsv(`${slugify(cycle.name)}-completion-summary.csv`, csv);
}

export function exportEmployeeStatusCsv(cycle: Pick<AppraisalCycle, "name">, rows: ParticipantReportRow[]) {
  const csv = rowsToCsv(
    [
      "employee_name",
      "job_title",
      "unit",
      "manager",
      "goals_status",
      "goal_weight_pct",
      "interim_status",
      "interim_score",
      "final_status",
      "final_score",
      "overall_score",
      "acknowledgement_status",
      "overdue_tasks",
      "employment",
    ],
    rows.map((r) => [
      r.employeeName,
      r.jobTitle,
      r.unit,
      r.managerName,
      statusLabel(r.goals),
      r.goalWeightSum,
      statusLabel(r.interim),
      formatScore(r.interimScore),
      statusLabel(r.final),
      formatScore(r.finalScore),
      formatScore(r.overallScore),
      statusLabel(r.acknowledgement),
      r.overdueTasks.map((t) => TASK_LABELS[t]).join("; "),
      r.frozen ? "terminated" : "active",
    ]),
  );
  downloadCsv(`${slugify(cycle.name)}-employee-status.csv`, csv);
}

export function exportManagerCompletionCsv(cycle: Pick<AppraisalCycle, "name">, managers: ManagerReportRow[]) {
  const csv = rowsToCsv(
    [
      "manager_name",
      "assigned_reviews",
      "goals_complete",
      "interim_complete",
      "final_complete",
      "acknowledged",
      "overdue_reports",
      "goals_completion_pct",
      "final_completion_pct",
    ],
    managers.map((m) => [
      m.managerName,
      m.assigned,
      m.goalsComplete,
      m.interimComplete,
      m.finalComplete,
      m.acknowledged,
      m.overdueCount,
      m.assigned === 0 ? 0 : Math.round((m.goalsComplete / m.assigned) * 100),
      m.assigned === 0 ? 0 : Math.round((m.finalComplete / m.assigned) * 100),
    ]),
  );
  downloadCsv(`${slugify(cycle.name)}-manager-completion.csv`, csv);
}

export function exportOverdueTasksCsv(cycle: Pick<AppraisalCycle, "name">, tasks: OverdueTaskRow[]) {
  const csv = rowsToCsv(
    ["user_name", "role", "employee", "task_type", "due_date", "days_overdue", "manager", "unit"],
    tasks.map((t) => [
      t.userName,
      t.role,
      t.employeeName,
      t.taskType,
      t.dueDate,
      t.daysOverdue,
      t.managerName,
      t.unit,
    ]),
  );
  downloadCsv(`${slugify(cycle.name)}-overdue-tasks.csv`, csv);
}
