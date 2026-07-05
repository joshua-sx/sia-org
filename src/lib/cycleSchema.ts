import { z } from "zod";

export const CYCLE_STATUSES = ["draft", "active", "completed"] as const;
export type CycleStatus = (typeof CYCLE_STATUSES)[number];

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

export const STAGES = ["interim", "final"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  interim: "Interim assessment",
  final: "Final assessment",
};

const dateStr = z
  .string()
  .min(1, "Required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker");

/**
 * Window fields in chronological order. Mirrors the DB CHECK
 * chk_cycle_windows_ordered: consecutive dates must be non-decreasing.
 */
export const WINDOW_FIELDS = [
  ["goal_window_start", "Goal window start"],
  ["goal_window_end", "Goal window end"],
  ["interim_window_start", "Interim window start"],
  ["interim_window_end", "Interim window end"],
  ["final_window_start", "Final window start"],
  ["final_window_end", "Final window end"],
  ["acknowledgement_due", "Acknowledgement due"],
] as const;

export type WindowField = (typeof WINDOW_FIELDS)[number][0];

export const cycleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    goal_window_start: dateStr,
    goal_window_end: dateStr,
    interim_window_start: dateStr,
    interim_window_end: dateStr,
    final_window_start: dateStr,
    final_window_end: dateStr,
    acknowledgement_due: dateStr,
  })
  .superRefine((v, ctx) => {
    for (let i = 1; i < WINDOW_FIELDS.length; i++) {
      const [prevKey, prevLabel] = WINDOW_FIELDS[i - 1];
      const [key] = WINDOW_FIELDS[i];
      // ISO dates compare correctly as strings.
      if (v[prevKey] && v[key] && v[key] < v[prevKey]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Must be on or after ${prevLabel.toLowerCase()}`,
        });
      }
    }
  });

export type CycleFormValues = z.infer<typeof cycleFormSchema>;

export function emptyCycleForm(): CycleFormValues {
  return {
    name: "",
    goal_window_start: "",
    goal_window_end: "",
    interim_window_start: "",
    interim_window_end: "",
    final_window_start: "",
    final_window_end: "",
    acknowledgement_due: "",
  };
}

export function toCycleDbPayload(v: CycleFormValues) {
  return {
    name: v.name.trim(),
    goal_window_start: v.goal_window_start,
    goal_window_end: v.goal_window_end,
    interim_window_start: v.interim_window_start,
    interim_window_end: v.interim_window_end,
    final_window_start: v.final_window_start,
    final_window_end: v.final_window_end,
    acknowledgement_due: v.acknowledgement_due,
  };
}

/** Local calendar date as YYYY-MM-DD (windows are org-local-date inclusive). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export type WindowState = "upcoming" | "open" | "closed";

export function windowState(start: string, end: string, today = todayISO()): WindowState {
  if (today < start) return "upcoming";
  if (today > end) return "closed";
  return "open";
}

export function formatWindow(start: string, end: string): string {
  return `${start} → ${end}`;
}
