import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParticipantGoalWeight {
  participant_id: string;
  weight: number;
}

/**
 * Summed goal weights per participant — shared by the tracker and the
 * completion/reports panels. Keyed on participant identity (sorted, joined),
 * not the array length, so a membership change with the same count still
 * invalidates the cache. `useGoals` invalidates the "cycle_goal_progress"
 * prefix on every goal write, which matches regardless of the third key segment.
 */
export function useCycleGoalWeights(cycleId: string, participantIds: string[]) {
  const key = [...participantIds].sort().join(",");

  return useQuery({
    queryKey: ["cycle_goal_progress", cycleId, key],
    queryFn: async () => {
      if (participantIds.length === 0) return [] as ParticipantGoalWeight[];
      const { data, error } = await supabase
        .from("goals")
        .select("participant_id, weight")
        .in("participant_id", participantIds);
      if (error) throw error;
      return (data ?? []) as ParticipantGoalWeight[];
    },
    enabled: participantIds.length > 0,
  });
}
