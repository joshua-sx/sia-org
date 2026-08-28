import { describe, expect, it } from "vitest";
import {
  CYCLE_NUDGE_TASK_LABELS,
  CYCLE_REPORT_TASK_LABELS,
  CYCLE_TASK_KINDS,
} from "@/lib/cycleTasks";

describe("cycle task domain", () => {
  it("keeps the canonical task kinds in workflow order", () => {
    expect(CYCLE_TASK_KINDS).toEqual([
      "goals",
      "interim",
      "final",
      "acknowledgement",
    ]);
  });

  it("preserves distinct report and nudge labels", () => {
    expect(CYCLE_TASK_KINDS.map((kind) => CYCLE_REPORT_TASK_LABELS[kind])).toEqual([
      "Goals",
      "Interim assessment",
      "Final assessment",
      "Acknowledgement",
    ]);
    expect(CYCLE_TASK_KINDS.map((kind) => CYCLE_NUDGE_TASK_LABELS[kind])).toEqual([
      "Set goals",
      "Interim assessment",
      "Final assessment",
      "Acknowledgement",
    ]);
  });
});
