import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toGoalDbPayload, type GoalFormValues } from "@/lib/goalSchema";

export interface Goal {
  id: string;
  participant_id: string;
  title: string;
  description: string | null;
  weight: number;
  created_at: string;
  updated_at: string;
}

/** Goals of a single participant. RLS limits writes to the participant's manager / hr_admin. */
export function useGoals(participantId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", participantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("participant_id", participantId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    enabled: !!participantId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goals", participantId] });
    qc.invalidateQueries({ queryKey: ["cycle_goal_progress"] });
  };

  const createGoal = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...toGoalDbPayload(values), participant_id: participantId! })
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: invalidate,
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GoalFormValues }) => {
      const { data, error } = await supabase
        .from("goals")
        .update(toGoalDbPayload(values))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: invalidate,
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, createGoal, updateGoal, deleteGoal };
}
