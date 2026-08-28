import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Goal } from "@/hooks/useGoals";

export type ParticipantGoalWeight = Pick<Goal, "participant_id" | "weight">;

export function activeCycleParticipants(
  participants: CycleParticipant[],
): CycleParticipant[] {
  return participants.filter(
    (participant) => participant.employee.employment_status !== "terminated",
  );
}

export function participantGoalWeightMap(
  goals: ParticipantGoalWeight[],
): Map<string, number> {
  const weights = new Map<string, number>();

  for (const goal of goals) {
    weights.set(
      goal.participant_id,
      (weights.get(goal.participant_id) ?? 0) + goal.weight,
    );
  }

  return weights;
}
