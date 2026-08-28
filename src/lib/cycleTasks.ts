export const CYCLE_TASK_KINDS = [
  "goals",
  "interim",
  "final",
  "acknowledgement",
] as const;

export type CycleTaskKind = (typeof CYCLE_TASK_KINDS)[number];

export const CYCLE_REPORT_TASK_LABELS: Record<CycleTaskKind, string> = {
  goals: "Goals",
  interim: "Interim assessment",
  final: "Final assessment",
  acknowledgement: "Acknowledgement",
};

export const CYCLE_NUDGE_TASK_LABELS: Record<CycleTaskKind, string> = {
  goals: "Set goals",
  interim: "Interim assessment",
  final: "Final assessment",
  acknowledgement: "Acknowledgement",
};
