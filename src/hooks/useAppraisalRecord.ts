import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Goal } from "@/hooks/useGoals";
import type { GoalRating } from "@/hooks/useAssessments";
import type { AppraisalRecordData } from "@/lib/appraisalRecord";

async function fetchAppraisalRecord(
  organizationName: string,
  cycle: AppraisalCycle,
  participant: CycleParticipant,
): Promise<AppraisalRecordData> {
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("participant_id", participant.id)
    .order("created_at", { ascending: true });
  if (goalsError) throw goalsError;

  const goalList = (goals ?? []) as Goal[];
  const goalIds = goalList.map((g) => g.id);
  let ratings: GoalRating[] = [];
  if (goalIds.length > 0) {
    const { data: ratingRows, error: ratingsError } = await supabase
      .from("goal_ratings")
      .select("*")
      .in("goal_id", goalIds);
    if (ratingsError) throw ratingsError;
    ratings = (ratingRows ?? []) as GoalRating[];
  }

  return { organizationName, cycle, participant, goals: goalList, ratings };
}

export function useAppraisalRecord(
  organizationName: string | undefined,
  cycle: AppraisalCycle | null | undefined,
  participant: CycleParticipant | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "appraisal_record",
      organizationName,
      cycle?.id,
      participant?.id,
    ],
    queryFn: () =>
      fetchAppraisalRecord(organizationName!, cycle!, participant!),
    enabled:
      enabled &&
      !!organizationName &&
      !!cycle &&
      !!participant &&
      !!participant.final_submitted_at,
  });
}

export { fetchAppraisalRecord };
