import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import {
  activeCycleParticipants,
  participantGoalWeightMap,
  type ParticipantGoalWeight,
} from "@/lib/cycleParticipantData";
import { canAcknowledge } from "@/lib/cycleSchema";

/**
 * A single row of the ProgressTracker. Steps are system-driven: they complete
 * only when the underlying data says so (timestamps, weights) — never from a
 * click. Exactly one step is "active"; everything after it is "pending".
 */
export interface TrackerStep {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
  /** Secondary text shown on the active row, e.g. "18/30 submitted". */
  sub?: string;
  /** Optional chip on the active row, deep-links to the owed action. */
  action?: { label: string; href: string };
}

export interface TrackerStepInput {
  id: string;
  label: string;
  done: boolean;
  sub?: string;
  action?: TrackerStep["action"];
}

/**
 * Turn an ordered list of done-flags into sequential tracker steps: the first
 * not-done item is "active", everything after it is "pending" (even if its
 * data looks done — the sequence is the source of truth). `sub` and `action`
 * are only surfaced on the active row.
 */
export function sequentialize(items: TrackerStepInput[]): TrackerStep[] {
  const activeIdx = items.findIndex((i) => !i.done);
  return items.map((i, idx) => {
    const status: TrackerStep["status"] =
      activeIdx === -1 || idx < activeIdx ? "done" : idx === activeIdx ? "active" : "pending";
    return {
      id: i.id,
      label: i.label,
      status,
      ...(status === "active" && i.sub ? { sub: i.sub } : {}),
      ...(status === "active" && i.action ? { action: i.action } : {}),
    };
  });
}

/**
 * HR cycle-level phases, derived from the same signals as the cycle detail
 * page: goal weights summing to 100 per participant, stage submission
 * timestamps, and acknowledgements. Terminated participants are excluded from
 * denominators (they're frozen). A completed cycle forces every phase done —
 * the persisted audit view.
 */
export function cycleTrackerSteps(
  cycle: Pick<AppraisalCycle, "status">,
  participants: CycleParticipant[],
  goalWeights: ParticipantGoalWeight[],
): TrackerStep[] {
  const active = activeCycleParticipants(participants);
  const n = active.length;

  const weightByParticipant = participantGoalWeightMap(goalWeights);

  const goalsReady = active.filter((p) => weightByParticipant.get(p.id) === 100).length;
  const interimDone = active.filter((p) => !!p.interim_submitted_at).length;
  const finalDone = active.filter((p) => !!p.final_submitted_at).length;
  const acknowledged = active.filter((p) => !!p.acknowledged_at).length;
  const completed = cycle.status === "completed";
  const all = (count: number) => completed || (n > 0 && count === n);

  return sequentialize([
    { id: "launch", label: "Configure & launch cycle", done: true },
    {
      id: "goals",
      label: "Assign goals",
      done: all(goalsReady),
      sub: `${goalsReady}/${n} goals set`,
      action: { label: "Goals", href: "/appraisals/goals" },
    },
    {
      id: "interim",
      label: "Interim assessments",
      done: all(interimDone),
      sub: `${interimDone}/${n} submitted`,
      action: { label: "Assessments", href: "/appraisals/assessments" },
    },
    {
      id: "final",
      label: "Final assessments",
      done: all(finalDone),
      sub: `${finalDone}/${n} submitted`,
      action: { label: "Assessments", href: "/appraisals/assessments" },
    },
    {
      id: "acknowledgement",
      label: "Acknowledgement & close",
      done: completed,
      sub: `${acknowledged}/${n} acknowledged`,
    },
  ]);
}

/**
 * Per-participant phases (manager sidebar, employee status card). Each step
 * completes off the real action landing: goals weighted to 100%, stage
 * submission timestamps, acknowledgement. The acknowledge chip only attaches
 * while the participant may actually acknowledge (mirrors the DB guard).
 */
export function participantTrackerSteps(
  participant: Pick<
    CycleParticipant,
    "interim_submitted_at" | "final_submitted_at" | "acknowledged_at" | "overall_score"
  >,
  goalWeightSum: number,
  opts: {
    acknowledgeAction?: TrackerStep["action"];
    cycle?: Pick<AppraisalCycle, "status" | "acknowledgement_due">;
  } = {},
): TrackerStep[] {
  return sequentialize([
    {
      id: "goals",
      label: "Goals assigned",
      done: goalWeightSum === 100,
      sub: `${goalWeightSum}% of 100% weighted`,
    },
    { id: "interim", label: "Interim assessment", done: !!participant.interim_submitted_at },
    { id: "final", label: "Final assessment", done: !!participant.final_submitted_at },
    {
      id: "acknowledgement",
      label: "Acknowledgement",
      done: !!participant.acknowledged_at,
      action: canAcknowledge(participant, opts.cycle) ? opts.acknowledgeAction : undefined,
    },
  ]);
}
