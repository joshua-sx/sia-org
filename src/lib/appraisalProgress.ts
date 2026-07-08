import type { TrackerStep } from "@/components/ProgressTracker";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Goal } from "@/hooks/useGoals";
import { canAcknowledge, windowState } from "@/lib/cycleSchema";
import { weightSum } from "@/lib/scoring";

/**
 * Shape a sequential appraisal state machine into `TrackerStep[]`. The first
 * step whose `done` flag is false becomes "active"; everything before it is
 * "done" and everything after is "pending". `sub` and `action` are only ever
 * attached to the active step, matching the ProgressTracker contract.
 */
interface StepSeed {
  id: string;
  label: string;
  done: boolean;
  sub?: string;
  action?: { label: string; href: string };
}

function sequentialSteps(seeds: StepSeed[]): TrackerStep[] {
  const activeIndex = seeds.findIndex((s) => !s.done);
  return seeds.map((seed, i): TrackerStep => {
    const status: TrackerStep["status"] =
      activeIndex === -1 || i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
    return {
      id: seed.id,
      label: seed.label,
      status,
      sub: status === "active" ? seed.sub : undefined,
      action: status === "active" ? seed.action : undefined,
    };
  });
}

export interface HrCycleProgress {
  /** Non-terminated participant count — the denominator for each phase. */
  active: number;
  goalsReady: number;
  interimDone: number;
  finalDone: number;
  acknowledged: number;
  cycleStatus: "active" | "completed";
}

/**
 * HR cycle-level tracker: phases check off from real completion counts, never
 * a manual advance. Configure is always done here because the panel only
 * renders once a cycle has launched.
 */
export function getHrCycleSteps({
  active,
  goalsReady,
  interimDone,
  finalDone,
  acknowledged,
  cycleStatus,
}: HrCycleProgress): TrackerStep[] {
  const allDone = (n: number) => active > 0 && n === active;
  const fanOut = (n: number, noun: string) => (active > 0 ? `${n}/${active} ${noun}` : undefined);

  return sequentialSteps([
    { id: "configure", label: "Configure cycle", done: true },
    {
      id: "goals",
      label: "Assign goals",
      done: allDone(goalsReady),
      sub: fanOut(goalsReady, "with goals"),
    },
    {
      id: "interim",
      label: "Interim assessments",
      done: allDone(interimDone),
      sub: fanOut(interimDone, "submitted"),
    },
    {
      id: "final",
      label: "Final assessments",
      done: allDone(finalDone),
      sub: fanOut(finalDone, "submitted"),
    },
    {
      id: "acknowledge",
      label: "Acknowledgements",
      done: allDone(acknowledged),
      sub: fanOut(acknowledged, "acknowledged"),
    },
    { id: "close", label: "Close cycle", done: cycleStatus === "completed" },
  ]);
}

/**
 * Manager tracker for a single employee's appraisal. Each step completes off
 * the manager's real action landing (goals weighted to 100%, interim/final
 * submitted) or the employee's acknowledgement.
 */
export function getManagerAppraisalSteps({
  participant,
  cycle,
  goals,
}: {
  participant: CycleParticipant;
  cycle: AppraisalCycle;
  goals: Goal[];
}): TrackerStep[] {
  const interimWindow = windowState(cycle.interim_window_start, cycle.interim_window_end);
  const finalWindow = windowState(cycle.final_window_start, cycle.final_window_end);
  const windowSub = (state: ReturnType<typeof windowState>) =>
    state === "open" ? "Window open" : state === "upcoming" ? "Window not open yet" : "Window closed";

  return sequentialSteps([
    { id: "goals", label: "Set goals", done: weightSum(goals) === 100 },
    {
      id: "interim",
      label: "Submit interim assessment",
      done: !!participant.interim_submitted_at,
      sub: windowSub(interimWindow),
    },
    {
      id: "final",
      label: "Submit final assessment",
      done: !!participant.final_submitted_at,
      sub: windowSub(finalWindow),
    },
    {
      id: "acknowledge",
      label: "Employee acknowledgement",
      done: !!participant.acknowledged_at,
      sub: "Awaiting employee",
    },
  ]);
}

/**
 * Employee tracker: read-only status framing. The one step the employee owns
 * (acknowledging) carries an action chip once it's actionable.
 */
export function getEmployeeAppraisalSteps({
  goals,
  participant,
}: {
  goals: Goal[];
  participant: CycleParticipant;
}): TrackerStep[] {
  return sequentialSteps([
    { id: "goals", label: "Goals assigned", done: goals.length > 0 },
    { id: "review", label: "Manager review", done: !!participant.final_submitted_at },
    {
      id: "acknowledge",
      label: "Acknowledge review",
      done: !!participant.acknowledged_at,
      sub: canAcknowledge(participant) ? undefined : "Awaiting your manager",
      action: canAcknowledge(participant)
        ? { label: "Review & sign", href: "/appraisals/my-review" }
        : undefined,
    },
  ]);
}
